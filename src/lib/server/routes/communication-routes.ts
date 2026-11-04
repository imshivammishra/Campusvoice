import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { ApiError, audit, hasPermission, requireAuth } from '../auth';
import {
  AUTHORITY_ROLES,
  NOTIFICATION_TYPE,
  PERMISSIONS,
  ROLES,
  SUPPORT_TICKET_STATUS,
} from '../constants';
import {
  AuditEvent,
  Class,
  CrMessage,
  Escalation,
  ManagementReview,
  Notification,
  Resolution,
  SupportMessage,
  SupportTicket,
  Upload,
  User,
} from '../models';
import type { RouteContext } from '../http';
import { json, makeId, pageParams, paginated, requireString } from '../http';

function isAuthority(role: string) {
  return AUTHORITY_ROLES.includes(role as any);
}

export async function handleCommunication(ctx: RouteContext): Promise<Response | null> {
  const [root, id, action] = ctx.segments;
  if (root === 'support') return support(ctx, id, action);
  if (root === 'notifications') return notifications(ctx, id, action);
  if (root === 'cr-messages') return crMessages(ctx, id, action);
  if (root === 'uploads' && ctx.method === 'POST') return upload(ctx);
  if (root === 'audit' && ctx.method === 'GET') return auditList(ctx);
  if (root === 'escalations' && ctx.method === 'GET') return escalationList(ctx);
  if (root === 'resolutions' && ctx.method === 'GET') return resolutionList(ctx);
  if (root === 'management-reviews') return reviews(ctx, id, action);
  return null;
}

/* ----------------------------------------------------------------- Support */

async function support(ctx: RouteContext, id?: string, action?: string) {
  if (ctx.method === 'GET' && !id) {
    const user = await requireAuth(ctx.req);
    const { page, limit, skip } = pageParams(ctx.searchParams, 50);
    const filter: Record<string, unknown> = {};
    if (isAuthority(user.role) || user.role === ROLES.TEACHER) {
      if (ctx.searchParams.get('mine') === 'true') filter.createdBy = user.sub;
    } else {
      filter.createdBy = user.sub;
    }
    if (ctx.searchParams.get('status')) filter.status = ctx.searchParams.get('status');
    const [data, total] = await Promise.all([
      SupportTicket.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit).lean(),
      SupportTicket.countDocuments(filter),
    ]);
    return json(paginated(data, total, page, limit));
  }

  if (ctx.method === 'POST' && !id) {
    const user = await requireAuth(ctx.req);
    const body = await ctx.body();
    const ticket = await SupportTicket.create({
      ticketId: makeId('TICKET'),
      createdBy: user.sub,
      subject: requireString(body.subject, 'Subject'),
      message: requireString(body.message, 'Message'),
      category: body.category || 'Other',
      confidentiality: body.confidentiality === 'public' ? 'public' : 'confidential',
      status: SUPPORT_TICKET_STATUS.OPEN,
      priority: body.priority || 'normal',
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      lastMessageAt: new Date(),
      responseDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
    await SupportMessage.create({
      ticketId: ticket._id,
      senderId: user.sub,
      senderName: user.fullName || user.username,
      senderRole: user.role,
      message: ticket.message,
    });
    await audit('support_ticket_created', {
      user,
      entityType: 'SupportTicket',
      entityId: ticket._id.toString(),
    });
    return json(ticket.toObject(), 201);
  }

  if (id && action === 'messages') {
    const user = await requireAuth(ctx.req);
    const ticket = await SupportTicket.findOne({ $or: [{ ticketId: id }, ...(id.match(/^[a-f0-9]{24}$/i) ? [{ _id: id }] : [])] });
    if (!ticket) throw new ApiError('Support ticket not found', 404);
    const allowed =
      ticket.createdBy.toString() === user.sub ||
      ticket.assignedTo?.toString() === user.sub ||
      isAuthority(user.role);
    if (!allowed) throw new ApiError('You do not have access to this ticket', 403);

    if (ctx.method === 'GET') {
      const messages = await SupportMessage.find({ ticketId: ticket._id, isInternal: { $ne: true } })
        .sort({ createdAt: 1 })
        .lean();
      if (ticket.createdBy.toString() === user.sub && ticket.unreadCount > 0) {
        await SupportTicket.updateOne({ _id: ticket._id }, { $set: { unreadCount: 0 } });
      }
      return json(messages.map((m: any) => ({ ...m, content: m.message })));
    }

    if (ctx.method === 'POST') {
      const body = await ctx.body();
      const message = await SupportMessage.create({
        ticketId: ticket._id,
        senderId: user.sub,
        senderName: user.fullName || user.username,
        senderRole: user.role,
        message: requireString(body.content || body.message, 'Message'),
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
      });
      const isOwner = ticket.createdBy.toString() === user.sub;
      await SupportTicket.updateOne(
        { _id: ticket._id },
        {
          $set: {
            status: isOwner ? SUPPORT_TICKET_STATUS.OPEN : SUPPORT_TICKET_STATUS.IN_PROGRESS,
            lastMessageAt: new Date(),
          },
          $inc: { unreadCount: isOwner ? 0 : 1 },
        },
      );
      const recipientId = isOwner ? ticket.assignedTo : ticket.createdBy;
      if (recipientId) {
        await Notification.create({
          userId: recipientId,
          type: NOTIFICATION_TYPE.SUPPORT_REPLY,
          title: 'New reply on your support ticket',
          message: ticket.subject,
          data: { ticketId: ticket.ticketId },
        });
      }
      return json({ ...message.toObject(), content: message.message }, 201);
    }
  }

  if (id && ctx.method === 'PATCH') {
    const user = await requireAuth(ctx.req);
    if (!isAuthority(user.role)) throw new ApiError('Only support officers can update tickets', 403);
    const body = await ctx.body();
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { $set: { status: body.status, assignedTo: body.assignedTo || user.sub } },
      { new: true },
    );
    if (!ticket) throw new ApiError('Support ticket not found', 404);
    return json(ticket.toObject());
  }

  return null;
}

/* ----------------------------------------------------------- Notifications */

async function notifications(ctx: RouteContext, id?: string, action?: string) {
  const user = await requireAuth(ctx.req);
  if (ctx.method === 'GET' && !id) {
    const { limit } = pageParams(ctx.searchParams, 50);
    const data = await Notification.find({ userId: user.sub })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return json({ data, total: data.length, unread: data.filter((n: any) => !n.isRead).length });
  }
  if (ctx.method === 'PATCH' && id && action === 'read') {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: user.sub },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );
    if (!notification) throw new ApiError('Notification not found', 404);
    return json(notification.toObject());
  }
  if (ctx.method === 'POST' && id === 'read-all') {
    await Notification.updateMany(
      { userId: user.sub, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
    return json({ success: true });
  }
  return null;
}

/* -------------------------------------------------------------- CR messages */

async function crMessages(ctx: RouteContext, id?: string, action?: string) {
  const user = await requireAuth(ctx.req);

  if (ctx.method === 'GET' && !id) {
    if (user.role === ROLES.CLASS_REPRESENTATIVE) {
      const filter: Record<string, unknown> = { crId: user.sub };
      if (user.classId) filter.$or = [{ crId: user.sub }, { classId: user.classId }];
      const messages = await CrMessage.find(filter).sort({ createdAt: -1 }).lean();
      const groups = new Map<string, any>();
      for (const message of [...messages].reverse()) {
        const studentId = message.studentId.toString();
        if (!groups.has(studentId)) {
          groups.set(studentId, {
            studentId,
            studentName: message.studentName || 'Student',
            lastMessage: message.body,
            messages: [],
          });
        }
        const group = groups.get(studentId);
        group.studentName = message.studentName || group.studentName;
        group.lastMessage = message.body;
        group.messages.push(mapCrMessage(message));
      }
      return json(Array.from(groups.values()));
    }

    const messages = await CrMessage.find({ studentId: user.sub }).sort({ createdAt: 1 }).lean();
    return json(messages.map(mapCrMessage));
  }

  if (ctx.method === 'POST' && !id) {
    const body = await ctx.body();
    const content = requireString(body.content || body.message, 'Message');
    let crId = body.crId;
    let classId = user.classId;
    if (!crId) {
      if (user.classId) {
        const klass = await Class.findById(user.classId).lean();
        crId = klass?.crId?.toString();
      }
      if (!crId) {
        const cr = await User.findOne({
          role: ROLES.CLASS_REPRESENTATIVE,
          ...(classId ? { classId } : { institutionId: user.institutionId }),
        }).lean();
        crId = cr?._id?.toString();
      }
    }
    const message = await CrMessage.create({
      studentId: user.sub,
      studentName: user.fullName || user.username,
      crId: crId || undefined,
      classId: classId || undefined,
      senderId: user.sub,
      senderRole: user.role,
      senderName: user.fullName || user.username,
      body: content,
    });
    if (crId) {
      await Notification.create({
        userId: crId,
        type: NOTIFICATION_TYPE.NEW_PROPOSAL,
        title: `New message from ${user.fullName || user.username}`,
        message: content.slice(0, 120),
        data: { studentId: user.sub },
      });
    }
    return json(mapCrMessage(message.toObject()), 201);
  }

  if (ctx.method === 'POST' && id === 'reply' && action) {
    if (user.role !== ROLES.CLASS_REPRESENTATIVE) {
      throw new ApiError('Only a Class Representative can reply in this inbox', 403);
    }
    const body = await ctx.body();
    const content = requireString(body.content || body.message, 'Message');
    const student = await User.findById(action).lean();
    if (!student) throw new ApiError('Student not found', 404);
    const message = await CrMessage.create({
      studentId: student._id,
      studentName: student.fullName || student.username,
      crId: user.sub,
      classId: user.classId || student.classId,
      senderId: user.sub,
      senderRole: user.role,
      senderName: user.fullName || user.username,
      body: content,
    });
    await Notification.create({
      userId: student._id,
      type: NOTIFICATION_TYPE.TEACHER_RESPONSE,
      title: 'Your Class Representative replied',
      message: content.slice(0, 120),
      data: { studentId: student._id.toString() },
    });
    return json(mapCrMessage(message.toObject()), 201);
  }

  return null;
}

function mapCrMessage(message: any) {
  return {
    ...message,
    content: message.body,
    body: message.body,
  };
}

/* ------------------------------------------------------------------ Uploads */

async function upload(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  const form = await ctx.req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new ApiError('No file supplied', 422);
  const blob = file as File;
  const maxBytes = 10 * 1024 * 1024;
  if (blob.size > maxBytes) throw new ApiError('File is larger than the 10 MB limit', 413);

  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  if (blob.type && !allowed.includes(blob.type)) {
    throw new ApiError('This file type is not allowed', 415);
  }

  const safeName = blob.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const filename = `${crypto.randomUUID()}-${safeName}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await blob.arrayBuffer()));

  const url = `/uploads/${filename}`;
  await Upload.create({
    filename,
    originalName: blob.name,
    mimeType: blob.type,
    size: blob.size,
    path: `/uploads/${filename}`,
    url,
    uploadedBy: user.sub,
  });

  return json({
    url,
    name: blob.name,
    size: blob.size,
    mimetype: blob.type,
  }, 201);
}

/* -------------------------------------------------------------------- Audit */

async function auditList(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  if (!hasPermission(user, PERMISSIONS.AUDIT_READ)) {
    throw new ApiError('You do not have permission to view audit logs', 403);
  }
  const { page, limit, skip } = pageParams(ctx.searchParams, 50);
  const filter: Record<string, unknown> = {};
  if (ctx.searchParams.get('action')) filter.action = ctx.searchParams.get('action');
  if (ctx.searchParams.get('userId')) filter.userId = ctx.searchParams.get('userId');
  const [data, total] = await Promise.all([
    AuditEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditEvent.countDocuments(filter),
  ]);
  return json(paginated(data, total, page, limit));
}

/* ------------------------------------------------- Escalations / resolutions */

async function escalationList(ctx: RouteContext) {
  const user = await requireAuth(ctx.req);
  if (!isAuthority(user.role) && user.role !== ROLES.TEACHER) {
    throw new ApiError('You do not have access to escalations', 403);
  }
  const data = await Escalation.find({}).sort({ createdAt: -1 }).limit(200).lean();
  return json(data);
}

async function resolutionList(ctx: RouteContext) {
  await requireAuth(ctx.req);
  const data = await Resolution.find({}).sort({ resolvedAt: -1 }).limit(200).lean();
  return json(data);
}

/* -------------------------------------------------------- Management reviews */

async function reviews(ctx: RouteContext, id?: string, action?: string) {
  const user = await requireAuth(ctx.req);

  if (ctx.method === 'GET' && !id) {
    if (!isAuthority(user.role) && user.role !== ROLES.TEACHER) {
      throw new ApiError('You do not have access to management reviews', 403);
    }
    const data = await ManagementReview.find({}).sort({ createdAt: -1 }).limit(200).lean();
    return json(data);
  }

  if (ctx.method === 'POST' && !id) {
    if (user.role !== ROLES.TEACHER && !isAuthority(user.role)) {
      throw new ApiError('Only teachers and authorities can open management reviews', 403);
    }
    const body = await ctx.body();
    const review = await ManagementReview.create({
      reviewId: makeId('REVIEW'),
      reviewType: body.reviewType || 'Formal Management Review',
      subject: requireString(body.subject, 'Subject'),
      submittedBy: user.sub,
      submittedByName: user.fullName || user.username,
      community: user.role === ROLES.TEACHER ? 'teacher' : 'student',
      status: 'submitted',
      responseDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    return json(review.toObject(), 201);
  }

  if (ctx.method === 'PATCH' && id) {
    if (!isAuthority(user.role)) {
      throw new ApiError('Only authorities can update management reviews', 403);
    }
    const body = await ctx.body();
    const review = await ManagementReview.findByIdAndUpdate(
      id,
      {
        $set: {
          status: body.status,
          findings: body.findings,
          recommendations: body.recommendations,
          reviewedBy: user.sub,
          reviewedByName: user.fullName || user.username,
          ...(body.status === 'closed' ? { closedAt: new Date() } : {}),
        },
      },
      { new: true },
    );
    if (!review) throw new ApiError('Management review not found', 404);
    return json(review.toObject());
  }

  return null;
}
