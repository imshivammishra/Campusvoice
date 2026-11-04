import {
  Class,
  CRAssignment,
  Department,
  Institution,
  User,
} from './models';
import { hashPassword } from './auth';
import { ROLES, ROLE_PERMISSIONS } from './constants';

let seedPromise: Promise<void> | null = null;

export function ensureSeedData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

const DEMO_PASSWORD = '12345678';

/**
 * Creates the account if it does not already exist. Existing accounts are left
 * untouched so a redeploy never overwrites live credentials.
 */
async function ensureUser(data: Record<string, any>, password: string) {
  const existing = await User.findOne({ username: data.username });
  if (existing) {
    // Migrate legacy argon2 hashes created by older builds to scrypt.
    if (typeof existing.passwordHash === 'string' && existing.passwordHash.startsWith('$argon2')) {
      existing.passwordHash = await hashPassword(password);
      await existing.save();
    }
    return existing;
  }
  return User.create({ ...data, passwordHash: await hashPassword(password) });
}

async function runSeed() {
  if (process.env.SEED_DEMO_DATA === 'false') return;

  // --- Institution --------------------------------------------------------
  let institution = await Institution.findOne({ code: 'HUIT' });
  if (!institution) {
    institution = await Institution.create({
      name: 'HUConnect Institute of Technology',
      code: 'HUIT',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      contactEmail: 'office@huconnect.edu',
      settings: { academicYear: new Date().getFullYear(), anonymousVoting: true },
    });
  }

  // --- Department ---------------------------------------------------------
  let department = await Department.findOne({ code: 'CSE', institutionId: institution._id });
  if (!department) {
    department = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      institutionId: institution._id,
      description: 'Department of Computer Science and Engineering',
    });
  }

  // --- Class --------------------------------------------------------------
  let klass = await Class.findOne({ code: 'CSE-A', departmentId: department._id });
  if (!klass) {
    klass = await Class.create({
      name: 'CSE - Section A',
      code: 'CSE-A',
      institutionId: institution._id,
      departmentId: department._id,
      academicYear: new Date().getFullYear(),
      semester: 1,
      section: 'A',
      studentCount: 4,
    });
  }

  const common = {
    institutionId: institution._id,
    isActive: true,
    isEmailVerified: true,
  };

  const studentBase = {
    ...common,
    departmentId: department._id,
    classId: klass._id,
    course: 'B.Tech CSE',
    academicYear: new Date().getFullYear(),
    semester: 1,
    className: klass.name,
    section: 'A',
  };

  // --- Super administrator ------------------------------------------------
  await ensureUser(
    {
      ...common,
      username: 'superadmin',
      email: 'superadmin@huconnect.local',
      fullName: 'Super Administrator',
      role: ROLES.SUPER_ADMIN,
      permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
    },
    DEMO_PASSWORD,
  );

  // --- Teacher ------------------------------------------------------------
  await ensureUser(
    {
      ...common,
      username: 'annapurna',
      email: 'annapurna@huconnect.edu',
      fullName: 'Annapurna Tiwari',
      role: ROLES.TEACHER,
      permissions: ROLE_PERMISSIONS.TEACHER,
      departmentId: department._id,
      employeeId: 'HU-EMP-001',
      designation: 'Assistant Professor',
    },
    DEMO_PASSWORD,
  );

  // --- Class Representative ----------------------------------------------
  const cr = await ensureUser(
    {
      ...studentBase,
      username: 'harsh',
      email: 'harsh@huconnect.edu',
      fullName: 'Harsh',
      role: ROLES.CLASS_REPRESENTATIVE,
      permissions: ROLE_PERMISSIONS.CLASS_REPRESENTATIVE,
      studentId: 'HU-STU-001',
    },
    DEMO_PASSWORD,
  );

  // --- Students -----------------------------------------------------------
  await ensureUser(
    {
      ...studentBase,
      username: 'himanshu',
      email: 'himanshu@huconnect.edu',
      fullName: 'Himanshu',
      role: ROLES.STUDENT,
      permissions: ROLE_PERMISSIONS.STUDENT,
      studentId: 'HU-STU-002',
    },
    DEMO_PASSWORD,
  );
  await ensureUser(
    {
      ...studentBase,
      username: 'ayushi',
      email: 'ayushi@huconnect.edu',
      fullName: 'Ayushi',
      role: ROLES.STUDENT,
      permissions: ROLE_PERMISSIONS.STUDENT,
      studentId: 'HU-STU-003',
    },
    DEMO_PASSWORD,
  );
  await ensureUser(
    {
      ...studentBase,
      username: 'shivam',
      email: 'shivam@huconnect.edu',
      fullName: 'Shivam',
      role: ROLES.STUDENT,
      permissions: ROLE_PERMISSIONS.STUDENT,
      studentId: 'HU-STU-004',
    },
    DEMO_PASSWORD,
  );
  // --- Link the CR to the class ------------------------------------------
  if (!klass.crId || klass.crId.toString() !== cr._id.toString()) {
    klass.crId = cr._id;
    await klass.save();
  }
  const hasAssignment = await CRAssignment.exists({
    classId: klass._id,
    studentId: cr._id,
    isActive: true,
  });
  if (!hasAssignment) {
    await CRAssignment.create({
      classId: klass._id,
      studentId: cr._id,
      assignedAt: new Date(),
      isActive: true,
    });
  }
}

export async function ensureBootstrapAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'super_admin').toLowerCase().trim();
  const email = (process.env.ADMIN_EMAIL || 'admin@campusvoice.local').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'SuperAdmin123!';
  if (!username || !password) return;

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    if (typeof existing.passwordHash === 'string' && existing.passwordHash.startsWith('$argon2')) {
      existing.passwordHash = await hashPassword(password);
      existing.username = username;
      existing.email = email;
      existing.fullName = existing.fullName || 'Super Administrator';
      existing.role = ROLES.SUPER_ADMIN;
      existing.permissions = ROLE_PERMISSIONS.SUPER_ADMIN;
      existing.isActive = true;
      existing.isEmailVerified = true;
      await existing.save();
    }
    return existing;
  }

  return User.create({
    username,
    email,
    fullName: 'Super Administrator',
    passwordHash: await hashPassword(password),
    role: ROLES.SUPER_ADMIN,
    permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
    isActive: true,
    isEmailVerified: true,
  });
}
