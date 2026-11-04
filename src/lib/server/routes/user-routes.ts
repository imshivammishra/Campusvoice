import { ApiError, audit, hashPassword, hasPermission, requireAuth, sanitizeUser } from '../auth';
import { AUTHORITY_ROLES, PERMISSIONS, ROLES, ROLE_PERMISSIONS } from '../constants';
import {
  AnonymousBallot,
  AuditEvent,
  Class,
  CRAssignment,
  CRElection,
  CrMessage,
  Department,
  Escalation,
  Institution,
  ManagementReview,
  Notification,
  Proposal,
  RegistrationApproval,
  Resolution,
  SupportMessage,
  SupportTicket,
  User,
  VotingAuthorization,
} from '../models';
import { escapeRegex, json, makeId, pageParams, paginated, requireString } from '../http';
import type { RouteContext } from '../http';

export async function handleUsers(ctx: RouteContext): Promise<Response | null> {
  const [root, id, action] = ctx.segments;
  if (root === 'users') return users(ctx, id, action);
  if (root === 'students' && ctx.method === 'GET') return listStudents(ctx);
  if (root === 'registrations') return registrations(ctx, id, action);
  if (root === 'admin') return admin(ctx, id);
  return null;
}

// Student directory readable by teachers and higher authorities (and admins).
async function listStudents(ctx: RouteContext) {
  const viewer = await requireAuth(ctx.req);
  const allowed =
    viewer.role === ROLES.TEACHER ||
    viewer.role === ROLES.SUPER_ADMIN ||
    AUTHORITY_ROLES.includes(viewer.role as any);
  if (!allowed) {
    throw new ApiError('You do not have permission to view the student directory', 403);
  }
  const { page, limit, skip } = pageParams(ctx.searchParams, 200);
  const filter: Record<string, unknown> = {
    role: { $in: [ROLES.STUDENT, ROLES.CLASS_REPRESENTATIVE] },
  };
  const search = ctx.searchParams.get('search');
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { fullName: rx },
      { username: rx },
      { email: rx },
      { studentId: rx },
      { className: rx },
    ];
  }
  const classId = ctx.searchParams.get('classId');
  if (classId) filter.classId = classId;
  const [data, total] = await Promise.all([
    User.find(filter).sort({ fullName: 1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  return json(paginated(data.map(sanitizeUser), total, page, limit));
}

async function users(ctx: RouteContext, id?: string, action?: string) {
  if (ctx.method === 'DELETE' && id === 'bulk') {
    const viewer = await requireAuth(ctx.req);
    if (viewer.role !== ROLES.SUPER_ADMIN && !hasPermission(viewer, PERMISSIONS.USERS_DEACTIVATE)) {
      throw new ApiError('You do not have permission to delete users', 403);
    }
    const body = await ctx.body().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((v: any) => typeof v === 'string') : [];
    const targetIds = ids.filter((id) => id !== viewer.sub);
    if (targetIds.length === 0) {
      return json({ success: true, deleted: 0 });
    }
    const targets = await User.find({ _id: { $in: targetIds }, role: { $ne: ROLES.SUPER_ADMIN } }).select('_id').lean();
    const deleteIds = targets.map((u: any) => u._id.toString());
    if (deleteIds.length === 0) {
      return json({ success: true, deleted: 0 });
    }
    await Promise.all([
      User.deleteMany({ _id: { $in: deleteIds } }),
      Notification.deleteMany({ userId: { $in: deleteIds } }),
      SupportTicket.deleteMany({ createdBy: { $in: deleteIds } }),
      SupportMessage.deleteMany({ senderId: { $in: deleteIds } }),
      Proposal.deleteMany({ createdBy: { $in: deleteIds } }),
      CrMessage.deleteMany({ $or: [{ studentId: { $in: deleteIds } }, { senderId: { $in: deleteIds } }] }),
      RegistrationApproval.deleteMany({ userId: { $in: deleteIds } }),
      VotingAuthorization.deleteMany({ userId: { $in: deleteIds } }),
      AuditEvent.deleteMany({ userId: { $in: deleteIds } }),
    ]);
    await audit('accounts_bulk_deleted', { user: viewer, entityType: 'User', metadata: { count: deleteIds.length } });
    return json({ success: true, deleted: deleteIds.length });
  }

  if (ctx.method === 'GET' && !id) {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_READ)) {
      throw new ApiError('You do not have permission to list users', 403);
    }
    const { page, limit, skip } = pageParams(ctx.searchParams, 100);
    const filter: Record<string, unknown> = {};
    const role = ctx.searchParams.get('role');
    const status = ctx.searchParams.get('status');
    const search = ctx.searchParams.get('search');
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ fullName: rx }, { username: rx }, { email: rx }, { studentId: rx }, { employeeId: rx }];
    }
    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return json(paginated(data.map(sanitizeUser), total, page, limit));
  }

  if (ctx.method === 'POST' && !id) {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_CREATE)) {
      throw new ApiError('You do not have permission to create users', 403);
    }
    const body = await ctx.body();
    const role = String(body.role || ROLES.STUDENT);
    if (!Object.values(ROLES).includes(role as any)) throw new ApiError('Invalid role', 422);
    if (role === ROLES.SUPER_ADMIN && viewer.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError('Only a super admin can create another super admin', 403);
    }
    const password = requireString(body.password, 'Password');
    if (password.length < 8) throw new ApiError('Password must be at least 8 characters', 422);
    const user = await User.create({
      username: requireString(body.username, 'Username').toLowerCase(),
      email: requireString(body.email, 'Email').toLowerCase(),
      passwordHash: await hashPassword(password),
      fullName: requireString(body.fullName, 'Full name'),
      role,
      permissions: Array.isArray(body.permissions) ? body.permissions : ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [],
      phone: body.phone || undefined,
      studentId: body.studentId || undefined,
      employeeId: body.employeeId || undefined,
      className: body.className || undefined,
      section: body.section || undefined,
      course: body.course || undefined,
      institutionId: body.institutionId || viewer.institutionId || undefined,
      departmentId: body.departmentId || undefined,
      classId: body.classId || undefined,
      isActive: body.isActive !== false,
      isEmailVerified: true,
    });
    await audit('user_created', {
      user: viewer,
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { role },
    });
    return json(sanitizeUser(user), 201);
  }

  if (ctx.method === 'POST' && id === 'bulk') {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_CREATE)) {
      throw new ApiError('You do not have permission to create users', 403);
    }
    const body = await ctx.body();
    const students = Array.isArray(body.students) ? body.students : [];
    const defaults = body.defaults || {};
    const sharedPassword =
      typeof defaults.password === 'string' ? defaults.password.trim() : '';
    if (sharedPassword && sharedPassword.length < 8) {
      throw new ApiError('Custom password must be at least 8 characters', 422);
    }
    const results: any[] = [];
    let created = 0;
    let failed = 0;

    for (let index = 0; index < students.length; index += 1) {
      const row = students[index];
      const fullName = String(row.fullName || '').trim();
      if (!fullName) {
        failed += 1;
        results.push({ ok: false, fullName, error: 'Full name is required' });
        continue;
      }
      try {
        const base = fullName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')
          .replace(/^\.+|\.+$/g, '')
          .slice(0, 24);
        let username = base || `student${Date.now()}`;
        let suffix = 1;
        while (await User.exists({ username })) {
          username = `${base}${suffix}`;
          suffix += 1;
        }
        const rowPassword =
          typeof row.password === 'string' ? row.password.trim() : '';
        const customPassword = rowPassword || sharedPassword;
        if (customPassword && customPassword.length < 8) {
          failed += 1;
          results.push({
            ok: false,
            fullName,
            studentId: row.studentId,
            error: 'Password must be at least 8 characters',
          });
          continue;
        }
        const tempPassword =
          customPassword || `Cv${Math.random().toString(36).slice(2, 8)}!${index + 1}`;
        const email = row.email
          ? String(row.email).toLowerCase()
          : `${username}@student.campusvoice.local`;
        const providedStudentId = typeof row.studentId === 'string' ? row.studentId.trim() : '';
        const createStudent = async (studentId?: string) =>
          User.create({
            username,
            email,
            passwordHash: await hashPassword(tempPassword),
            fullName,
            role: ROLES.STUDENT,
            permissions: ROLE_PERMISSIONS.STUDENT,
            studentId: studentId || undefined,
            className: defaults.className || undefined,
            section: defaults.section || undefined,
            course: defaults.course || undefined,
            institutionId: viewer.institutionId || undefined,
            isActive: true,
            isEmailVerified: true,
          });
        let user: any;
        try {
          user = await createStudent(providedStudentId || undefined);
        } catch (createError: any) {
          // Work around legacy unique indexes that treat a missing studentId as
          // null and therefore allow only one such document. Retry with a
          // generated unique student id so the account can still be created.
          if (createError?.code === 11000 && !providedStudentId) {
            user = await createStudent(`AUTO-${Date.now()}-${index + 1}`);
          } else {
            throw createError;
          }
        }
        created += 1;
        results.push({
          ok: true,
          _id: user._id.toString(),
          fullName,
          username,
          email,
          password: tempPassword,
          studentId: user.studentId,
        });
      } catch (error: any) {
        failed += 1;
        results.push({
          ok: false,
          fullName,
          studentId: row.studentId,
          error: error?.code === 11000 ? ('Duplicate ' + (Object.keys(error.keyPattern || error.keyValue || {})[0] || 'username, email or student ID')) : (error?.message || 'Failed'),
        });
      }
    }
    return json({ created, failed, results });
  }

  if (ctx.method === 'GET' && id) {
    const viewer = await requireAuth(ctx.req);
    if (viewer.sub !== id && !hasPermission(viewer, PERMISSIONS.USERS_READ)) {
      throw new ApiError('You do not have permission to view this user', 403);
    }
    const user = await User.findById(id).lean();
    if (!user) throw new ApiError('User not found', 404);
    return json(sanitizeUser(user));
  }

  if ((ctx.method === 'PATCH' || ctx.method === 'PUT') && id && !action) {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_UPDATE)) {
      throw new ApiError('You do not have permission to update users', 403);
    }
    const body = await ctx.body();
    const update: Record<string, unknown> = {};
    for (const key of [
      'fullName', 'email', 'phone', 'studentId', 'employeeId', 'className',
      'section', 'course', 'designation', 'authorityId', 'appointmentDetails',
    ]) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.academicYear !== undefined) update.academicYear = Number(body.academicYear);
    if (body.semester !== undefined) update.semester = Number(body.semester);
    if (body.isActive !== undefined) update.isActive = body.isActive;
    if (body.email) update.email = String(body.email).toLowerCase();
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) throw new ApiError('User not found', 404);
    await audit('account_update', { user: viewer, entityType: 'User', entityId: id, metadata: update });
    return json(sanitizeUser(user));
  }

  if (ctx.method === 'PATCH' && id && action === 'role') {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_UPDATE)) {
      throw new ApiError('You do not have permission to change roles', 403);
    }
    const body = await ctx.body();
    const role = String(body.role || '');
    if (!Object.values(ROLES).includes(role as any)) throw new ApiError('Invalid role', 422);
    if (role === ROLES.SUPER_ADMIN && viewer.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError('Only a super admin can assign the super admin role', 403);
    }
    const target = await User.findById(id);
    if (!target) throw new ApiError('User not found', 404);
    target.role = role;
    target.permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
    if (role === ROLES.CLASS_REPRESENTATIVE && target.classId) {
      await CRAssignment.updateMany({ studentId: target._id, isActive: true }, { isActive: false, revokedAt: new Date() });
      await CRAssignment.create({
        classId: target.classId,
        studentId: target._id,
        assignedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      });
    }
    await target.save();
    await audit('role_changed', { user: viewer, entityType: 'User', entityId: id, metadata: { role } });
    return json(sanitizeUser(target));
  }

  if (ctx.method === 'PATCH' && id && action === 'permissions') {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_UPDATE)) {
      throw new ApiError('You do not have permission to change permissions', 403);
    }
    const body = await ctx.body();
    const permissions = Array.isArray(body.permissions) ? body.permissions.filter((p: unknown) => typeof p === 'string') : [];
    const target = await User.findByIdAndUpdate(id, { permissions }, { new: true });
    if (!target) throw new ApiError('User not found', 404);
    await audit('permissions_changed', { user: viewer, entityType: 'User', entityId: id, metadata: { permissions } });
    return json(sanitizeUser(target));
  }

  if (ctx.method === 'PATCH' && id && (action === 'activate' || action === 'deactivate')) {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_DEACTIVATE)) {
      throw new ApiError('You do not have permission to change account status', 403);
    }
    if (viewer.sub === id && action === 'deactivate') {
      throw new ApiError('You cannot deactivate your own account', 422);
    }
    const target = await User.findByIdAndUpdate(id, { isActive: action === 'activate' }, { new: true });
    if (!target) throw new ApiError('User not found', 404);
    if (action === 'deactivate') {
      await User.updateOne({ _id: id }, { $set: { refreshTokens: [] } });
    }
    await audit(action === 'activate' ? 'account_activated' : 'deactivate_account', {
      user: viewer,
      entityType: 'User',
      entityId: id,
    });
    return json(sanitizeUser(target));
  }

  if (ctx.method === 'POST' && id && action === 'reset-password') {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_CREDENTIAL_RESET)) {
      throw new ApiError('You do not have permission to reset credentials', 403);
    }
    const temporaryPassword = `Cv${Math.random().toString(36).slice(2, 6)}${Math.random().toString(36).slice(2, 6)}!`;
    const target = await User.findById(id);
    if (!target) throw new ApiError('User not found', 404);
    target.passwordHash = await hashPassword(temporaryPassword);
    target.refreshTokens = [];
    target.failedLoginAttempts = 0;
    target.lockUntil = undefined;
    await target.save();
    await audit('credential_reset', {
      user: viewer,
      entityType: 'User',
      entityId: id,
      metadata: { type: 'authority_initiated' },
    });
    return json({ success: true, temporaryPassword });
  }

  if (ctx.method === 'DELETE' && id) {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_DEACTIVATE)) {
      throw new ApiError('You do not have permission to delete users', 403);
    }
    if (viewer.sub === id) throw new ApiError('You cannot delete your own account', 422);
    const target = await User.findById(id);
    if (!target) throw new ApiError('User not found', 404);
    if (target.role === ROLES.SUPER_ADMIN && viewer.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError('Only a super admin can delete a super admin', 403);
    }
    await Promise.all([
      User.deleteOne({ _id: id }),
      Notification.deleteMany({ userId: id }),
      SupportTicket.deleteMany({ createdBy: id }),
      SupportMessage.deleteMany({ senderId: id }),
      Proposal.deleteMany({ createdBy: id }),
      CrMessage.deleteMany({ $or: [{ studentId: id }, { senderId: id }] }),
      RegistrationApproval.deleteMany({ userId: id }),
      VotingAuthorization.deleteMany({ userId: id }),
      AuditEvent.deleteMany({ userId: id }),
    ]);
    await audit('account_deleted', { user: viewer, entityType: 'User', entityId: id });
    return json({ success: true });
  }

  return null;
}

async function registrations(ctx: RouteContext, id?: string, action?: string) {
  if (ctx.method === 'GET' && !id) {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_READ)) {
      throw new ApiError('You do not have permission to view registrations', 403);
    }
    const status = ctx.searchParams.get('status') || 'pending';
    const filter = status === 'all' ? {} : { status };
    const data = await RegistrationApproval.find(filter).sort({ createdAt: -1 }).lean();
    return json(
      data.map((item: any) => ({
        ...item,
        role: item.requestedRole,
        reference: `REG-${item._id.toString().slice(-6).toUpperCase()}`,
      })),
    );
  }

  if (ctx.method === 'PATCH' && id && (action === 'approve' || action === 'reject')) {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.USERS_UPDATE)) {
      throw new ApiError('You do not have permission to process registrations', 403);
    }
    const registration = await RegistrationApproval.findById(id);
    if (!registration) throw new ApiError('Registration not found', 404);
    if (registration.status !== 'pending') throw new ApiError('This registration has already been processed', 409);

    if (action === 'approve') {
      registration.status = 'approved';
      registration.reviewedBy = viewer.sub as any;
      registration.reviewedAt = new Date();
      await registration.save();
      if (registration.userId) {
        await User.updateOne(
          { _id: registration.userId },
          {
            $set: {
              isActive: true,
              isEmailVerified: true,
              emailVerifiedAt: new Date(),
              role: registration.requestedRole,
              permissions: ROLE_PERMISSIONS[registration.requestedRole as keyof typeof ROLE_PERMISSIONS] || [],
              ...(registration.classId ? { classId: registration.classId } : {}),
              ...(registration.departmentId ? { departmentId: registration.departmentId } : {}),
              ...(registration.className ? { className: registration.className } : {}),
            },
          },
        );
        await Notification.create({
          userId: registration.userId,
          type: 'account_activation',
          title: 'Your account is active',
          message: 'Your HUConnect registration was approved. You can now sign in.',
        });
      }
      await audit('approve_registration', {
        user: viewer,
        entityType: 'RegistrationApproval',
        entityId: id,
      });
      return json({ success: true, status: 'approved' });
    }

    registration.status = 'rejected';
    registration.reviewedBy = viewer.sub as any;
    registration.reviewedAt = new Date();
    await registration.save();
    if (registration.userId) {
      await User.updateOne({ _id: registration.userId }, { $set: { isActive: false } });
    }
    await audit('reject_registration', {
      user: viewer,
      entityType: 'RegistrationApproval',
      entityId: id,
    });
    return json({ success: true, status: 'rejected' });
  }

  return null;
}

async function admin(ctx: RouteContext, id?: string) {
  if (ctx.method === 'GET' && id === 'stats') {
    const viewer = await requireAuth(ctx.req);
    if (!hasPermission(viewer, PERMISSIONS.AUDIT_READ) && viewer.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError('You do not have permission to view system statistics', 403);
    }
    const [
      users,
      activeUsers,
      inactiveUsers,
      students,
      teachers,
      authorities,
      pendingRegistrations,
      institutions,
      departments,
      classes,
      proposals,
      elections,
      activeElections,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.TEACHER }),
      User.countDocuments({
        role: {
          $in: [
            ROLES.SUPER_ADMIN, ROLES.CHAIRMAN, ROLES.VICE_CHAIRMAN,
            ROLES.PRO_VICE_CHANCELLOR, ROLES.REGISTRAR, ROLES.PRINCIPAL, ROLES.HOD,
          ],
        },
      }),
      RegistrationApproval.countDocuments({ status: 'pending' }),
      Institution.countDocuments({}),
      Department.countDocuments({}),
      Class.countDocuments({}),
      Proposal.countDocuments({}),
      CRElection.countDocuments({}),
      CRElection.countDocuments({ status: 'active' }),
    ]);
    return json({
      users,
      activeUsers,
      inactiveUsers,
      students,
      teachers,
      authorities,
      pendingRegistrations,
      institutions,
      departments,
      classes,
      proposals,
      elections,
      activeElections,
      auditEvents: await AuditEvent.countDocuments({}),
      tickets: await SupportTicket.countDocuments({}),
    });
  }

  if (ctx.method === 'POST' && id === 'reset') {
    const viewer = await requireAuth(ctx.req);
    if (viewer.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError('Only a super admin can reset system data', 403);
    }
    const body = await ctx.body().catch(() => ({}));
    if (body?.confirm !== 'RESET') {
      throw new ApiError('Send { "confirm": "RESET" } to confirm this dangerous operation', 422);
    }
    const keep = await User.find({ role: ROLES.SUPER_ADMIN }).select('_id').lean();
    const keepIds = keep.map((u: any) => u._id);
    await Promise.all([
      User.deleteMany({ role: { $ne: ROLES.SUPER_ADMIN } }),
      Proposal.deleteMany({}),
      CRElection.deleteMany({}),
      CRCandidateDelete(),
      CRAssignment.deleteMany({}),
      AnonymousBallot.deleteMany({}),
      VotingAuthorization.deleteMany({}),
      Notification.deleteMany({ userId: { $nin: keepIds } }),
      SupportTicket.deleteMany({}),
      SupportMessage.deleteMany({}),
      Escalation.deleteMany({}),
      Resolution.deleteMany({}),
      ManagementReview.deleteMany({}),
      CrMessage.deleteMany({}),
      RegistrationApproval.deleteMany({}),
    ]);
    await audit('system_reset', { user: viewer, entityType: 'System' });
    return json({ success: true, message: 'System data cleared. Super admin accounts were preserved.' });
  }

  return null;
}

async function CRCandidateDelete() {
  const { CRCandidate } = await import('../models');
  await CRCandidate.deleteMany({});
}
