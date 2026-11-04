import {
  Class,
  CRElection,
  CRCandidate,
  CRAssignment,
  Department,
  Institution,
  ManagementReview,
  Notification,
  Proposal,
  SupportMessage,
  SupportTicket,
  User,
} from './models';
import { hashPassword } from './auth';
import { ROLES, ROLE_PERMISSIONS } from './constants';
import { makeId } from './http';

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

async function upsertUser(data: Record<string, any>, password: string) {
  const existing = await User.findOne({ username: data.username });
  if (existing) {
    // Existing database: link the account to the demo institution without
    // touching its password or granted role.
    if (!existing.institutionId && data.institutionId) {
      existing.institutionId = data.institutionId;
      if (!existing.departmentId && data.departmentId) existing.departmentId = data.departmentId;
      if (!existing.classId && data.classId) existing.classId = data.classId;
      await existing.save();
    }
    return existing;
  }
  return User.create({ ...data, passwordHash: await hashPassword(password) });
}

async function runSeed() {
  if (process.env.SEED_DEMO_DATA === 'false') return;

  let institution = await Institution.findOne({ code: 'CVIT' });
  if (!institution) {
    institution = await Institution.create({
      name: 'HUConnect Institute of Technology',
      code: 'CVIT',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      contactEmail: 'office@campusvoice.edu',
      contactPhone: '+91 80 4000 1000',
      website: 'https://campusvoice.edu',
      settings: {
        academicYear: new Date().getFullYear(),
        electionDay: 'Monday',
        anonymousVoting: true,
      },
    });
  }

  const ensureDepartment = async (name: string, code: string, description: string) => {
    let department = await Department.findOne({ code, institutionId: institution._id });
    if (!department) {
      department = await Department.create({
        name,
        code,
        institutionId: institution._id,
        description,
      });
    }
    return department;
  };

  const cse = await ensureDepartment('Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering');
  const ece = await ensureDepartment('Electronics & Communication', 'ECE', 'Department of Electronics and Communication');
  const mgmt = await ensureDepartment('Management Studies', 'MBA', 'Department of Management Studies');

  const ensureClass = async (name: string, code: string, departmentId: any, semester: number, section: string, studentCount: number) => {
    let klass = await Class.findOne({ code, departmentId });
    if (!klass) {
      klass = await Class.create({
        name,
        code,
        institutionId: institution._id,
        departmentId,
        academicYear: new Date().getFullYear(),
        semester,
        section,
        studentCount,
      });
    }
    return klass;
  };

  const classA = await ensureClass('CSE - 3rd Year - Section A', 'CSE-3A', cse._id, 5, 'A', 48);
  const classB = await ensureClass('CSE - 2nd Year - Section B', 'CSE-2B', cse._id, 3, 'B', 52);
  await ensureClass('ECE - 3rd Year - Section A', 'ECE-3A', ece._id, 5, 'A', 44);
  await ensureClass('MBA - 1st Year', 'MBA-1', mgmt._id, 1, '', 60);

  const common = {
    institutionId: institution._id,
    isActive: true,
    isEmailVerified: true,
  };

  const admin = await upsertUser(
    {
      ...common,
      username: process.env.ADMIN_USERNAME || 'super_admin',
      email: process.env.ADMIN_EMAIL || 'admin@campusvoice.local',
      fullName: 'System Administrator',
      role: ROLES.SUPER_ADMIN,
      permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
    },
    process.env.ADMIN_PASSWORD || 'SuperAdmin123!',
  );

  await upsertUser(
    {
      ...common,
      username: 'registrar',
      email: 'registrar@campusvoice.edu',
      fullName: 'Dr. Meera Iyer',
      role: ROLES.REGISTRAR,
      permissions: ROLE_PERMISSIONS.REGISTRAR,
    },
    'CampusVoice123!',
  );

  await upsertUser(
    {
      ...common,
      username: 'principal',
      email: 'principal@campusvoice.edu',
      fullName: 'Dr. Rajesh Nair',
      role: ROLES.PRINCIPAL,
      permissions: ROLE_PERMISSIONS.PRINCIPAL,
    },
    'CampusVoice123!',
  );

  const hod = await upsertUser(
    {
      ...common,
      username: 'hod.cse',
      email: 'hod.cse@campusvoice.edu',
      fullName: 'Dr. Ananya Rao',
      role: ROLES.HOD,
      permissions: ROLE_PERMISSIONS.HOD,
      departmentId: cse._id,
    },
    'CampusVoice123!',
  );
  if (!cse.hodId) {
    cse.hodId = hod._id;
    await cse.save();
  }

  const teacher = await upsertUser(
    {
      ...common,
      username: 'teacher1',
      email: 'teacher1@campusvoice.edu',
      fullName: 'Prof. Vivek Menon',
      role: ROLES.TEACHER,
      permissions: ROLE_PERMISSIONS.TEACHER,
      departmentId: cse._id,
      employeeId: 'EMP-1001',
      designation: 'Assistant Professor',
    },
    'CampusVoice123!',
  );

  const cr = await upsertUser(
    {
      ...common,
      username: 'cr1',
      email: 'cr1@campusvoice.edu',
      fullName: 'Aarav Sharma',
      role: ROLES.CLASS_REPRESENTATIVE,
      permissions: ROLE_PERMISSIONS.CLASS_REPRESENTATIVE,
      departmentId: cse._id,
      classId: classA._id,
      studentId: 'STU-2023-001',
      course: 'B.Tech CSE',
      academicYear: new Date().getFullYear(),
      semester: 5,
      className: classA.name,
      section: 'A',
    },
    'CampusVoice123!',
  );

  const student = await upsertUser(
    {
      ...common,
      username: 'student1',
      email: 'student1@campusvoice.edu',
      fullName: 'Priya Verma',
      role: ROLES.STUDENT,
      permissions: ROLE_PERMISSIONS.STUDENT,
      departmentId: cse._id,
      classId: classA._id,
      studentId: 'STU-2023-014',
      course: 'B.Tech CSE',
      academicYear: new Date().getFullYear(),
      semester: 5,
      className: classA.name,
      section: 'A',
    },
    'CampusVoice123!',
  );

  const student2 = await upsertUser(
    {
      ...common,
      username: 'student2',
      email: 'student2@campusvoice.edu',
      fullName: 'Rohan Gupta',
      role: ROLES.STUDENT,
      permissions: ROLE_PERMISSIONS.STUDENT,
      departmentId: cse._id,
      classId: classA._id,
      studentId: 'STU-2023-021',
      course: 'B.Tech CSE',
      academicYear: new Date().getFullYear(),
      semester: 5,
      className: classA.name,
      section: 'A',
    },
    'CampusVoice123!',
  );

  if (!classA.crId) {
    classA.crId = cr._id;
    await classA.save();
  }

  const hasAssignment = await CRAssignment.exists({ classId: classA._id, studentId: cr._id, isActive: true });
  if (!hasAssignment) {
    await CRAssignment.create({
      classId: classA._id,
      studentId: cr._id,
      assignedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
  }

  const now = Date.now();
  let election = await CRElection.findOne({ classId: classA._id });
  if (!election) {
    election = await CRElection.create({
      electionId: makeId('ELECTION'),
      classId: classA._id,
      className: classA.name,
      title: 'Weekly Class Representative Election',
      opensAt: new Date(now - 60 * 60 * 1000),
      closesAt: new Date(now + 6 * 60 * 60 * 1000),
      nominationOpensAt: new Date(now - 48 * 60 * 60 * 1000),
      nominationClosesAt: new Date(now - 24 * 60 * 60 * 1000),
      status: 'active',
      totalEligibleVoters: 48,
      totalParticipatingVoters: 0,
      schedulingMode: 'auto_schedule',
      nextElectionAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
    });

    await CRCandidate.create([
      {
        electionId: election._id,
        studentId: cr._id,
        studentName: cr.fullName,
        className: classA.name,
        manifesto: 'More transparent class communication and faster issue escalation.',
        status: 'approved',
        votes: 0,
      },
      {
        electionId: election._id,
        studentId: student2._id,
        studentName: student2.fullName,
        className: classA.name,
        manifesto: 'Better lab access, study groups and a weekly open forum.',
        status: 'approved',
        votes: 0,
      },
    ]);
  }

  let concern = await Proposal.findOne({ type: 'student_concern', title: /workstations/i });
  if (!concern) {
    concern = await Proposal.create({
      proposalId: makeId('CONCERN'),
      createdBy: cr._id,
      crId: cr._id,
      title: 'Add more workstations to the CSE programming lab',
      description:
        'The current programming lab has 32 working systems for 48 students. During practical sessions, students share machines, which limits hands-on time and slows down assessments.',
      category: 'Infrastructure',
      type: 'student_concern',
      department: cse.name,
      community: 'student',
      classId: classA._id,
      proposedSolution:
        'Add 20 new workstations and schedule lab batches by roll number until the upgrade is complete.',
      confidentiality: 'class',
      status: 'voting_active',
      audienceType: 'class',
      supportVotes: 18,
      opposeVotes: 2,
      abstainVotes: 1,
      raisedByName: cr.fullName,
      raisedByRole: cr.role,
      votingOpenedAt: new Date(now - 2 * 60 * 60 * 1000),
      events: [
        {
          action: 'created',
          actorId: cr._id.toString(),
          actorName: cr.fullName,
          actorRole: cr.role,
          note: 'Concern raised for class review.',
          at: new Date(now - 6 * 60 * 60 * 1000),
        },
        {
          action: 'voting_opened',
          actorId: cr._id.toString(),
          actorName: cr.fullName,
          actorRole: cr.role,
          note: 'Class voting opened.',
          at: new Date(now - 2 * 60 * 60 * 1000),
        },
      ],
    });
  }

  let teacherProposal = await Proposal.findOne({ type: 'teacher_proposal', title: /research mentorship/i });
  if (!teacherProposal) {
    teacherProposal = await Proposal.create({
      proposalId: makeId('PROPOSAL'),
      createdBy: teacher._id,
      title: 'Introduce a department-level research mentorship programme',
      description:
        'Students currently have no structured route into faculty research. A mentorship programme would pair interested students with faculty projects and improve outcomes for final-year projects.',
      category: 'Academic Policies',
      type: 'teacher_proposal',
      department: cse.name,
      community: 'teacher',
      proposedSolution:
        'Create a semester-long research mentorship programme with a transparent allocation process.',
      status: 'voting_active',
      audienceType: 'department',
      confidentiality: 'public',
      supportVotes: 9,
      opposeVotes: 1,
      abstainVotes: 0,
      raisedByName: teacher.fullName,
      raisedByRole: teacher.role,
      votingOpenedAt: new Date(now - 30 * 60 * 1000),
      events: [
        {
          action: 'created',
          actorId: teacher._id.toString(),
          actorName: teacher.fullName,
          actorRole: teacher.role,
          at: new Date(now - 3 * 60 * 60 * 1000),
        },
      ],
    });
  }

  const hasReview = await ManagementReview.exists({ subject: /laboratory infrastructure/i });
  if (!hasReview) {
    await ManagementReview.create({
      proposalId: concern._id,
      reviewId: makeId('REVIEW'),
      reviewType: 'Formal Management Review',
      subject: 'Review of laboratory infrastructure funding',
      submittedBy: teacher._id,
      submittedByName: teacher.fullName,
      community: 'teacher',
      status: 'under_review',
      responseDeadline: new Date(now + 10 * 24 * 60 * 60 * 1000),
    });
  }

  const hasTicket = await SupportTicket.exists({ subject: /exam accommodation/i });
  if (!hasTicket) {
    const ticket = await SupportTicket.create({
      ticketId: makeId('TICKET'),
      createdBy: student._id,
      subject: 'Need support with exam accommodation',
      message:
        'I would like to request a confidential conversation about a medical accommodation for an upcoming examination.',
      category: 'Student Welfare',
      confidentiality: 'confidential',
      status: 'open',
      priority: 'high',
      unreadCount: 0,
      lastMessageAt: new Date(now - 20 * 60 * 1000),
    });
    await SupportMessage.create({
      ticketId: ticket._id,
      senderId: student._id,
      senderName: student.fullName,
      senderRole: student.role,
      message: ticket.message,
    });
  }

  const hasNotifications = await Notification.exists({ userId: student._id });
  if (!hasNotifications) {
    await Notification.create([
      {
        userId: student._id,
        type: 'election_opened',
        title: 'CR election is live',
        message: 'Vote for your Class Representative. Polls close in 6 hours.',
        data: { electionId: election._id.toString() },
      },
      {
        userId: student._id,
        type: 'voting_opened',
        title: 'Class concern open for voting',
        message: 'The programming lab concern is now open for anonymous class voting.',
        data: { proposalId: concern._id.toString() },
      },
      {
        userId: cr._id,
        type: 'new_proposal',
        title: 'Management review opened',
        message: 'A formal management review was raised for the lab infrastructure concern.',
      },
    ]);
  }

  void admin;
  void classB;
  void teacherProposal;
}
