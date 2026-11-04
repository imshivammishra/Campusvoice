import { ApiError, audit, requireAuth, requirePermission } from '../auth';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '../constants';
import {
  AnonymousBallot,
  Class,
  CRAssignment,
  CRElection,
  CRCandidate,
  Department,
  Institution,
  Notification,
  User,
  VotingAuthorization,
} from '../models';
import type { RouteContext } from '../http';
import { json, requireString } from '../http';

export async function handleOrg(ctx: RouteContext): Promise<Response | null> {
  const [root, id, sub] = ctx.segments;

  if (root === 'institutions') return institutions(ctx, id, sub);
  if (root === 'departments') return departments(ctx, id, sub);
  if (root === 'classes') return classes(ctx, id, sub);
  if (root === 'permissions' && ctx.method === 'GET') return permissionList(ctx);
  if (root === 'roles' && ctx.method === 'GET') return roleList(ctx);
  return null;
}

async function institutions(ctx: RouteContext, id?: string, sub?: string) {
  if (ctx.method === 'GET' && !id) {
    await requireAuth(ctx.req);
    const data = await Institution.find({}).sort({ name: 1 }).lean();
    return json(data);
  }

  if (ctx.method === 'POST' && !id) {
    const user = await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const body = await ctx.body();
    const name = requireString(body.name, 'Institution name');
    const code = requireString(body.code, 'Institution code').toUpperCase();
    const institution = await Institution.create({
      name,
      code,
      contactEmail: body.email || body.contactEmail,
      contactPhone: body.phone || body.contactPhone,
      address: body.address,
      city: body.city,
      state: body.state,
      country: body.country,
      website: body.website,
      isActive: true,
    });
    await audit('institution_created', {
      user,
      entityType: 'Institution',
      entityId: institution._id.toString(),
    });
    return json(institution.toObject(), 201);
  }

  if (ctx.method === 'GET' && id) {
    await requireAuth(ctx.req);
    const institution = await Institution.findById(id).lean();
    if (!institution) throw new ApiError('Institution not found', 404);
    return json(institution);
  }

  if ((ctx.method === 'PATCH' || ctx.method === 'PUT') && id) {
    await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const body = await ctx.body();
    const update: Record<string, unknown> = {};
    for (const key of ['name', 'code', 'address', 'city', 'state', 'country', 'website', 'isActive']) {
      if (body[key] !== undefined) update[key] = key === 'code' ? String(body[key]).toUpperCase() : body[key];
    }
    if (body.email !== undefined) update.contactEmail = body.email;
    if (body.phone !== undefined) update.contactPhone = body.phone;
    const institution = await Institution.findByIdAndUpdate(id, update, { new: true });
    if (!institution) throw new ApiError('Institution not found', 404);
    return json(institution.toObject());
  }

  if (ctx.method === 'DELETE' && id) {
    await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const institution = await Institution.findById(id);
    if (!institution) throw new ApiError('Institution not found', 404);
    const departments = await Department.find({ institutionId: id }).select('_id').lean();
    const departmentIds = departments.map((d: any) => d._id);
    const classes = await Class.find({ institutionId: id }).select('_id').lean();
    const classIds = classes.map((c: any) => c._id);
    const elections = await CRElection.find({ classId: { $in: classIds } }).select('_id').lean();
    const electionIds = elections.map((e: any) => e._id);
    const userIds = await User.find({ institutionId: id }).distinct('_id');
    await Promise.all([
      Institution.deleteOne({ _id: id }),
      Department.deleteMany({ institutionId: id }),
      Class.deleteMany({ institutionId: id }),
      User.deleteMany({ institutionId: id }),
      CRElection.deleteMany({ classId: { $in: classIds } }),
      CRCandidate.deleteMany({ electionId: { $in: electionIds } }),
      AnonymousBallot.deleteMany({ electionId: { $in: electionIds }, scope: 'election' }),
      VotingAuthorization.deleteMany({ electionId: { $in: electionIds } }),
      CRAssignment.deleteMany({ classId: { $in: classIds } }),
      Notification.deleteMany({ userId: { $in: userIds } }),
    ]);
    return json({ success: true });
  }

  return null;
}

async function departments(ctx: RouteContext, id?: string, _sub?: string) {
  if (ctx.method === 'GET' && !id) {
    await requireAuth(ctx.req);
    const filter: Record<string, unknown> = {};
    if (ctx.searchParams.get('institutionId')) filter.institutionId = ctx.searchParams.get('institutionId');
    if (ctx.searchParams.get('active') !== 'all') filter.isActive = true;
    const data = await Department.find(filter).sort({ name: 1 }).lean();
    return json(data);
  }

  if (ctx.method === 'POST' && !id) {
    const user = await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const body = await ctx.body();
    const department = await Department.create({
      name: requireString(body.name, 'Department name'),
      code: requireString(body.code, 'Department code').toUpperCase(),
      institutionId: requireString(body.institutionId, 'Institution'),
      description: body.description,
      hodId: body.hodId || undefined,
      isActive: true,
    });
    await audit('department_created', {
      user,
      entityType: 'Department',
      entityId: department._id.toString(),
    });
    return json(department.toObject(), 201);
  }

  if (ctx.method === 'GET' && id) {
    await requireAuth(ctx.req);
    const department = await Department.findById(id).lean();
    if (!department) throw new ApiError('Department not found', 404);
    return json(department);
  }

  if ((ctx.method === 'PATCH' || ctx.method === 'PUT') && id) {
    await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const body = await ctx.body();
    const update: Record<string, unknown> = {};
    for (const key of ['name', 'code', 'description', 'hodId', 'isActive']) {
      if (body[key] !== undefined) update[key] = key === 'code' ? String(body[key]).toUpperCase() : body[key];
    }
    const department = await Department.findByIdAndUpdate(id, update, { new: true });
    if (!department) throw new ApiError('Department not found', 404);
    return json(department.toObject());
  }

  if (ctx.method === 'DELETE' && id) {
    await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const department = await Department.findById(id);
    if (!department) throw new ApiError('Department not found', 404);
    const classes = await Class.find({ departmentId: id }).select('_id').lean();
    const classIds = classes.map((c: any) => c._id);
    const elections = await CRElection.find({ classId: { $in: classIds } }).select('_id').lean();
    const electionIds = elections.map((e: any) => e._id);
    const userIds = await User.find({ departmentId: id }).distinct('_id');
    await Promise.all([
      Department.deleteOne({ _id: id }),
      Class.deleteMany({ departmentId: id }),
      User.deleteMany({ departmentId: id }),
      CRElection.deleteMany({ classId: { $in: classIds } }),
      CRCandidate.deleteMany({ electionId: { $in: electionIds } }),
      AnonymousBallot.deleteMany({ electionId: { $in: electionIds }, scope: 'election' }),
      VotingAuthorization.deleteMany({ electionId: { $in: electionIds } }),
      CRAssignment.deleteMany({ classId: { $in: classIds } }),
      Notification.deleteMany({ userId: { $in: userIds } }),
    ]);
    return json({ success: true });
  }
  return null;
}

async function classes(ctx: RouteContext, id?: string, _sub?: string) {
  if (ctx.method === 'GET' && !id) {
    await requireAuth(ctx.req);
    const filter: Record<string, unknown> = {};
    if (ctx.searchParams.get('departmentId')) filter.departmentId = ctx.searchParams.get('departmentId');
    if (ctx.searchParams.get('institutionId')) filter.institutionId = ctx.searchParams.get('institutionId');
    if (ctx.searchParams.get('active') !== 'all') filter.isActive = true;
    const data = await Class.find(filter).sort({ name: 1 }).lean();
    return json(data);
  }

  if (ctx.method === 'POST' && !id) {
    const user = await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const body = await ctx.body();
    const departmentId = requireString(body.departmentId, 'Department');
    let institutionId = body.institutionId;
    if (!institutionId) {
      const dept = await Department.findById(departmentId).lean();
      if (!dept) throw new ApiError('Department not found', 404);
      institutionId = dept.institutionId;
    }
    const klass = await Class.create({
      name: requireString(body.name, 'Class name'),
      code: requireString(body.code, 'Class code'),
      departmentId,
      institutionId,
      academicYear: Number(body.academicYear) || new Date().getFullYear(),
      semester: Number(body.semester) || 1,
      section: body.section,
      studentCount: Number(body.studentCount) || 0,
      isActive: true,
    });
    await audit('class_created', { user, entityType: 'Class', entityId: klass._id.toString() });
    return json(klass.toObject(), 201);
  }

  if (ctx.method === 'GET' && id) {
    await requireAuth(ctx.req);
    const klass = await Class.findById(id).lean();
    if (!klass) throw new ApiError('Class not found', 404);
    return json(klass);
  }

  if ((ctx.method === 'PATCH' || ctx.method === 'PUT') && id) {
    await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const body = await ctx.body();
    const update: Record<string, unknown> = {};
    for (const key of ['name', 'code', 'section', 'crId', 'isActive', 'studentCount']) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.academicYear !== undefined) update.academicYear = Number(body.academicYear);
    if (body.semester !== undefined) update.semester = Number(body.semester);
    const klass = await Class.findByIdAndUpdate(id, update, { new: true });
    if (!klass) throw new ApiError('Class not found', 404);
    return json(klass.toObject());
  }

  if (ctx.method === 'DELETE' && id) {
    await requirePermission(ctx.req, PERMISSIONS.INSTITUTION_CONFIGURE);
    const klass = await Class.findById(id);
    if (!klass) throw new ApiError('Class not found', 404);
    const elections = await CRElection.find({ classId: id }).select('_id').lean();
    const electionIds = elections.map((e: any) => e._id);
    const userIds = await User.find({ classId: id }).distinct('_id');
    await Promise.all([
      Class.deleteOne({ _id: id }),
      User.deleteMany({ classId: id }),
      CRElection.deleteMany({ classId: id }),
      CRCandidate.deleteMany({ electionId: { $in: electionIds } }),
      AnonymousBallot.deleteMany({ electionId: { $in: electionIds }, scope: 'election' }),
      VotingAuthorization.deleteMany({ electionId: { $in: electionIds } }),
      CRAssignment.deleteMany({ classId: id }),
      Notification.deleteMany({ userId: { $in: userIds } }),
    ]);
    return json({ success: true });
  }
  return null;
}

async function permissionList(ctx: RouteContext) {
  await requireAuth(ctx.req);
  return json(Object.values(PERMISSIONS));
}

async function roleList(ctx: RouteContext) {
  await requireAuth(ctx.req);
  return json(
    Object.values(ROLES).map((role) => ({
      name: role,
      permissions: ROLE_PERMISSIONS[role],
      isSystem: true,
    })),
  );
}
