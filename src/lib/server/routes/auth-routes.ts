import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  ApiError,
  audit,
  clearAuthCookies,
  clientMeta,
  getCurrentUser,
  hashPassword,
  sanitizeUser,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from '../auth';
import { COOKIE_NAMES, ROLES, ROLE_PERMISSIONS } from '../constants';
import { Class, Department, Institution, RegistrationApproval, User } from '../models';
import type { RouteContext } from '../http';
import { json, requireString } from '../http';

const MAX_FAILED = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10);
const LOCK_MINUTES = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '15', 10);

export async function handleAuth(ctx: RouteContext): Promise<Response | null> {
  const [root, action, sub] = ctx.segments;
  if (root !== 'auth') return null;

  if (ctx.method === 'POST' && action === 'login') return login(ctx);
  if (ctx.method === 'POST' && action === 'logout') return logout(ctx);
  if (ctx.method === 'POST' && action === 'refresh') return refresh(ctx);
  if (ctx.method === 'GET' && action === 'me') return me(ctx);
  if (ctx.method === 'POST' && action === 'register') return register(ctx);
  if (ctx.method === 'GET' && action === 'register-options') return registerOptions(ctx);
  if (ctx.method === 'POST' && action === 'password-reset' && sub === 'request') {
    return requestPasswordReset(ctx);
  }
  if (ctx.method === 'POST' && action === 'password-reset' && sub === 'confirm') {
    return confirmPasswordReset(ctx);
  }
  return null;
}

async function login(ctx: RouteContext) {
  const body = await ctx.body();
  const password = requireString(body.password, 'Password');
  let user: any = null;

  if (body.studentId && body.email) {
    user = await User.findOne({ studentId: String(body.studentId).trim() }).select('+passwordHash');
    if (!user || user.email?.toLowerCase() !== String(body.email).trim().toLowerCase()) {
      throw new ApiError('Invalid credentials', 401);
    }
  } else {
    const identifier = requireString(
      body.usernameOrEmail || body.username || body.email,
      'Username or email',
    );
    user = await User.findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() },
      ],
    }).select('+passwordHash');
  }

  if (!user) throw new ApiError('Invalid credentials', 401);
  if (user.isActive === false) {
    throw new ApiError('Your account is pending approval or has been deactivated', 401);
  }
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new ApiError(
      `Account is temporarily locked. Try again after ${new Date(user.lockUntil).toLocaleTimeString()}`,
      423,
    );
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const update: Record<string, unknown> = { failedLoginAttempts: attempts };
    if (attempts >= MAX_FAILED) {
      update.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      update.failedLoginAttempts = 0;
    }
    await User.updateOne({ _id: user._id }, update);
    await audit('login_failed', { user: { sub: user._id.toString(), username: user.username }, entityType: 'User', entityId: user._id.toString(), ...clientMeta(ctx.req) });
    throw new ApiError('Invalid credentials', 401);
  }

  const tokens = {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
  const meta = clientMeta(ctx.req);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        failedLoginAttempts: 0,
        lockUntil: undefined,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ip,
      },
      $push: {
        refreshTokens: {
          token: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  );
  await audit('login', {
    user: { sub: user._id.toString(), username: user.username },
    entityType: 'User',
    entityId: user._id.toString(),
    ...meta,
  });

  const response = json({ user: sanitizeUser(user) });
  return setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
}

async function logout(ctx: RouteContext) {
  const user = await ctx.user();
  const refreshToken = ctx.req.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
  // If the access token has expired, still revoke the refresh token so a
  // sign-out cannot leave a usable session behind.
  let userId = user?.sub;
  if (!userId && refreshToken) {
    try {
      userId = verifyRefreshToken(refreshToken).sub;
    } catch {
      userId = undefined;
    }
  }
  if (userId) {
    if (refreshToken) {
      await User.updateOne({ _id: userId }, { $pull: { refreshTokens: { token: refreshToken } } });
    } else {
      await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
    }
    await audit('logout', { user, entityType: 'User', entityId: userId, ...clientMeta(ctx.req) });
  }
  return clearAuthCookies(json({ success: true }));
}

async function refresh(ctx: RouteContext) {
  const token = ctx.req.cookies.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
  if (!token) throw new ApiError('Refresh token required', 401);
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError('Invalid or expired refresh token', 401);
  }
  const user = await User.findById(payload.sub);
  if (!user || user.isActive === false) throw new ApiError('User not found or deactivated', 401);
  const hasToken = (user.refreshTokens || []).some((item: any) => item.token === token);
  if (!hasToken) throw new ApiError('Refresh token has been revoked', 401);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  // MongoDB rejects an update that touches the same array with $pull and $push.
  // Rotate in two sequential, atomic operations instead. The pull is scoped to
  // the presented token so concurrent refreshes cannot revoke a newer token.
  await User.updateOne({ _id: user._id }, { $pull: { refreshTokens: { token } } });
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  );
  const response = json({ success: true });
  return setAuthCookies(response, accessToken, refreshToken);
}

async function me(ctx: RouteContext) {
  const session = await getCurrentUser(ctx.req);
  if (!session) throw new ApiError('Authentication required', 401);
  const user = await User.findById(session.sub).lean();
  if (!user) throw new ApiError('User not found', 404);
  return json({ user: sanitizeUser(user) });
}

async function registerOptions(_ctx: RouteContext) {
  const [institutions, departments, classes] = await Promise.all([
    Institution.find({ isActive: { $ne: false } })
      .select('name code city state')
      .sort({ name: 1 })
      .lean(),
    Department.find({ isActive: { $ne: false } })
      .select('name code institutionId')
      .sort({ name: 1 })
      .lean(),
    Class.find({ isActive: { $ne: false } })
      .select('name code departmentId institutionId semester section academicYear')
      .sort({ name: 1 })
      .lean(),
  ]);
  return json({ institutions, departments, classes });
}

async function register(ctx: RouteContext) {  const body = await ctx.body();
  const username = requireString(body.username, 'Username').toLowerCase();
  const email = requireString(body.email, 'Email').toLowerCase();
  const password = requireString(body.password, 'Password');
  const fullName = requireString(body.fullName || body.name, 'Full name');
  const requestedRole = body.role === ROLES.TEACHER ? ROLES.TEACHER : ROLES.STUDENT;

  if (password.length < 8) throw new ApiError('Password must be at least 8 characters', 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('Enter a valid email address', 422);
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    throw new ApiError('Username must be 3-32 characters (letters, numbers, dot, dash, underscore)', 422);
  }

  const conflict = await User.findOne({
    $or: [{ username }, { email }, ...(body.studentId ? [{ studentId: body.studentId }] : []), ...(body.employeeId ? [{ employeeId: body.employeeId }] : [])],
  }).lean();
  if (conflict) throw new ApiError('An account with these details already exists', 409);

  const user = await User.create({
    username,
    email,
    passwordHash: await hashPassword(password),
    fullName,
    role: requestedRole,
    permissions: ROLE_PERMISSIONS[requestedRole as keyof typeof ROLE_PERMISSIONS] || [],
    studentId: body.studentId || undefined,
    employeeId: body.employeeId || undefined,
    course: body.course || undefined,
    semester: body.semester ? Number(body.semester) : undefined,
    section: body.section || undefined,
    phone: body.phone || undefined,
    designation: body.designation || undefined,
    institutionId: body.institutionId || undefined,
    departmentId: body.departmentId || undefined,
    classId: body.classId || undefined,
    isActive: false,
    isEmailVerified: false,
  });

  const approval = await RegistrationApproval.create({
    userId: user._id,
    fullName,
    email,
    username,
    studentId: body.studentId,
    employeeId: body.employeeId,
    requestedRole,
    institutionId: body.institutionId || undefined,
    departmentId: body.departmentId || undefined,
    classId: body.classId || undefined,
    course: body.course,
    semester: body.semester ? Number(body.semester) : undefined,
    section: body.section,
    phone: body.phone,
    designation: body.designation,
    status: 'pending',
  });

  await audit('register', {
    user: { sub: user._id.toString(), username },
    entityType: 'User',
    entityId: user._id.toString(),
    ...clientMeta(ctx.req),
  });

  return json(
    {
      message:
        'Registration submitted. An authorized administrator will review and activate your account.',
      registrationId: approval._id.toString(),
      reference: `REG-${approval._id.toString().slice(-6).toUpperCase()}`,
    },
    201,
  );
}

async function requestPasswordReset(ctx: RouteContext) {
  const body = await ctx.body();
  const email = requireString(body.email, 'Email').toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    const token = jwt.sign(
      { sub: user._id.toString(), type: 'password-reset' },
      process.env.JWT_REFRESH_SECRET || 'campusvoice-dev-refresh-secret',
      { expiresIn: '1h' },
    );
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await audit('credential_reset', {
      user: { sub: user._id.toString(), username: user.username },
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { type: 'password_reset_requested' },
      ...clientMeta(ctx.req),
    });
    // In development the token is returned so the reset flow can be tested
    // without an SMTP server. In production only the generic message is sent.
    return json({
      message: 'If an account exists, a reset link has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { resetToken: token } : {}),
    });
  }
  return json({ message: 'If an account exists, a reset link has been sent.' });
}

async function confirmPasswordReset(ctx: RouteContext) {
  const body = await ctx.body();
  const token = requireString(body.token, 'Reset token');
  const newPassword = requireString(body.newPassword || body.password, 'New password');
  if (newPassword.length < 8) throw new ApiError('Password must be at least 8 characters', 422);

  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'campusvoice-dev-refresh-secret');
  } catch {
    throw new ApiError('Invalid or expired reset token', 401);
  }
  if (payload.type !== 'password-reset') throw new ApiError('Invalid reset token', 401);
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError('User not found', 404);
  if (!user.passwordResetToken || user.passwordResetToken !== token) {
    throw new ApiError('This reset link has already been used or is invalid', 401);
  }
  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    throw new ApiError('This reset link has expired', 401);
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];
  await user.save();
  await audit('credential_reset', {
    user: { sub: user._id.toString(), username: user.username },
    entityType: 'User',
    entityId: user._id.toString(),
    metadata: { type: 'password_reset_confirmed' },
    ...clientMeta(ctx.req),
  });
  return json({ success: true });
}
