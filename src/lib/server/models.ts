import { Schema, model, models, type Model } from 'mongoose';
import { ROLES } from './constants';

const ref = (name: string) => ({ type: Schema.Types.ObjectId, ref: name });
const opts = { timestamps: true } as const;

/* ------------------------------------------------------------------ User */
const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: Object.values(ROLES), index: true },
    permissions: { type: [String], default: [] },
    institutionId: ref('Institution'),
    departmentId: ref('Department'),
    classId: ref('Class'),
    studentId: String,
    course: String,
    academicYear: Number,
    semester: Number,
    className: String,
    section: String,
    phone: String,
    employeeId: String,
    designation: String,
    authorityId: String,
    appointmentDetails: String,
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: { type: [{ token: String, expiresAt: Date }], default: [] },
    cannotChangeUsername: { type: Boolean, default: false },
    cannotChangePassword: { type: Boolean, default: false },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
  },
  { ...opts, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);
UserSchema.index({ studentId: 1 }, { unique: true, partialFilterExpression: { studentId: { $type: 'string' } } });
UserSchema.index({ employeeId: 1 }, { unique: true, partialFilterExpression: { employeeId: { $type: 'string' } } });

/* ----------------------------------------------------------- Institution */
const InstitutionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: String,
    city: String,
    state: String,
    country: String,
    contactEmail: String,
    contactPhone: String,
    website: String,
    logoUrl: String,
    isActive: { type: Boolean, default: true },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  opts,
);

/* ------------------------------------------------------------ Department */
const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    institutionId: { ...ref('Institution'), required: true, index: true },
    hodId: ref('User'),
    description: String,
    isActive: { type: Boolean, default: true },
  },
  opts,
);
DepartmentSchema.index({ institutionId: 1, code: 1 }, { unique: true });

/* ----------------------------------------------------------------- Class */
const ClassSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    institutionId: { ...ref('Institution'), required: true, index: true },
    departmentId: { ...ref('Department'), required: true, index: true },
    academicYear: { type: Number, default: new Date().getFullYear() },
    semester: { type: Number, default: 1 },
    section: String,
    crId: ref('User'),
    studentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  opts,
);
ClassSchema.index({ departmentId: 1, code: 1 }, { unique: true });

/* ------------------------------------------------------------------ Role */
const RoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, uppercase: true },
    description: String,
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  opts,
);

const PermissionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    description: String,
    group: String,
  },
  opts,
);

/* ---------------------------------------------------------- Registration */
const RegistrationApprovalSchema = new Schema(
  {
    userId: ref('User'),
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    username: { type: String, required: true },
    studentId: String,
    employeeId: String,
    requestedRole: { type: String, default: ROLES.STUDENT },
    institutionId: ref('Institution'),
    departmentId: ref('Department'),
    classId: ref('Class'),
    course: String,
    semester: Number,
    section: String,
    phone: String,
    designation: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: ref('User'),
    reviewedAt: Date,
    rejectionReason: String,
    passwordHash: { type: String, select: false },
  },
  opts,
);

/* ------------------------------------------------------------- Elections */
const CRElectionSchema = new Schema(
  {
    electionId: { type: String, required: true, unique: true },
    classId: { ...ref('Class'), required: true, index: true },
    className: String,
    title: { type: String, required: true },
    opensAt: { type: Date, required: true },
    closesAt: { type: Date, required: true },
    nominationOpensAt: Date,
    nominationClosesAt: Date,
    status: {
      type: String,
      enum: ['scheduled', 'nomination_open', 'active', 'closed', 'certified', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    totalEligibleVoters: { type: Number, default: 0 },
    totalParticipatingVoters: { type: Number, default: 0 },
    validVotes: { type: Number, default: 0 },
    invalidBallots: { type: Number, default: 0 },
    winnerId: ref('User'),
    winnerName: String,
    certifiedAt: Date,
    tieBreakerMethod: String,
    schedulingMode: { type: String, enum: ['none', 'auto_schedule', 'manual'], default: 'auto_schedule' },
    nextElectionAt: Date,
  },
  opts,
);
CRElectionSchema.index({ classId: 1, status: 1 });

const CRCandidateSchema = new Schema(
  {
    electionId: { ...ref('CRElection'), required: true, index: true },
    studentId: { ...ref('User'), required: true, index: true },
    studentName: String,
    className: String,
    manifesto: String,
    status: {
      type: String,
      enum: ['nominated', 'approved', 'rejected', 'withdrawn', 'winner'],
      default: 'nominated',
    },
    votes: { type: Number, default: 0 },
    disqualifiedReason: String,
  },
  opts,
);
CRCandidateSchema.index({ electionId: 1, studentId: 1 }, { unique: true });

const CRAssignmentSchema = new Schema(
  {
    classId: { ...ref('Class'), required: true, index: true },
    studentId: { ...ref('User'), required: true, index: true },
    electionId: ref('CRElection'),
    assignedAt: { type: Date, default: Date.now },
    expiresAt: Date,
    isActive: { type: Boolean, default: true, index: true },
    revokedAt: Date,
    revokedReason: String,
  },
  opts,
);

/* ---------------------------------------------------------------- Proposal */
const ProposalEventSchema = new Schema(
  {
    action: String,
    actorId: String,
    actorName: String,
    actorRole: String,
    note: String,
    attachments: [String],
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ProposalSchema = new Schema(
  {
    proposalId: { type: String, required: true, unique: true },
    createdBy: { ...ref('User'), required: true, index: true },
    crId: ref('User'),
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true, index: true },
    department: String,
    community: { type: String, enum: ['student', 'teacher'], default: 'student', index: true },
    classId: ref('Class'),
    proposedSolution: String,
    supportingEvidence: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    confidentiality: {
      type: String,
      enum: ['public', 'class', 'department', 'confidential'],
      default: 'public',
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_review',
        'approved_for_voting',
        'voting_active',
        'voting_closed',
        'certified',
        'forwarded',
        'escalated',
        'resolved',
        'rejected',
        'cancelled',
      ],
      default: 'pending_review',
      index: true,
    },
    audienceType: {
      type: String,
      enum: ['student', 'teacher', 'institution', 'class', 'department'],
      default: 'student',
    },
    targetRole: String,
    supportVotes: { type: Number, default: 0 },
    opposeVotes: { type: Number, default: 0 },
    abstainVotes: { type: Number, default: 0 },
    votedUserIds: { type: [String], default: [], select: false },
    raisedByName: String,
    raisedByRole: String,
    events: { type: [ProposalEventSchema], default: [] },
    proofAttachments: { type: [String], default: [] },
    resolutionNote: String,
    resolvedByName: String,
    resolvedAt: Date,
    votingOpenedAt: Date,
    votingClosedAt: Date,
    certifiedAt: Date,
    forwardedTo: String,
    escalatedTo: String,
    resolutionId: String,
    versionHistory: {
      type: [
        {
          version: Number,
          title: String,
          description: String,
          modifiedAt: Date,
          modifiedBy: String,
        },
      ],
      default: [],
    },
  },
  opts,
);
ProposalSchema.index({ status: 1, createdAt: -1 });
ProposalSchema.index({ classId: 1, status: 1 });
ProposalSchema.index({ department: 1, status: 1 });

/* ----------------------------------------------------------------- Voting */
const AnonymousBallotSchema = new Schema(
  {
    scope: { type: String, enum: ['proposal', 'election'], required: true, index: true },
    proposalId: ref('Proposal'),
    electionId: ref('CRElection'),
    voterHash: { type: String, required: true, index: true },
    choice: { type: String, enum: ['support', 'oppose', 'abstain'] },
    candidateId: ref('CRCandidate'),
    castAt: { type: Date, default: Date.now },
  },
  opts,
);
AnonymousBallotSchema.index({ scope: 1, proposalId: 1, voterHash: 1 }, { unique: true, partialFilterExpression: { proposalId: { $exists: true } } });
AnonymousBallotSchema.index({ scope: 1, electionId: 1, voterHash: 1 }, { unique: true, partialFilterExpression: { electionId: { $exists: true } } });

const VotingAuthorizationSchema = new Schema(
  {
    userId: { ...ref('User'), required: true, index: true },
    scope: { type: String, enum: ['proposal', 'election'], required: true },
    proposalId: ref('Proposal'),
    electionId: ref('CRElection'),
    used: { type: Boolean, default: false },
    usedAt: Date,
  },
  opts,
);
VotingAuthorizationSchema.index({ userId: 1, scope: 1, proposalId: 1 }, { unique: true, partialFilterExpression: { proposalId: { $exists: true } } });
VotingAuthorizationSchema.index({ userId: 1, scope: 1, electionId: 1 }, { unique: true, partialFilterExpression: { electionId: { $exists: true } } });

/* ------------------------------------------------------------ Notification */
const NotificationSchema = new Schema(
  {
    userId: { ...ref('User'), required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
    emailSent: { type: Boolean, default: false },
  },
  opts,
);

/* ----------------------------------------------------------------- Support */
const SupportTicketSchema = new Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    createdBy: { ...ref('User'), required: true, index: true },
    assignedTo: ref('User'),
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    confidentiality: { type: String, enum: ['public', 'confidential'], default: 'public' },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated'],
      default: 'open',
      index: true,
    },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    attachments: { type: [String], default: [] },
    unreadCount: { type: Number, default: 0 },
    responseDeadline: Date,
    lastMessageAt: { type: Date, default: Date.now },
  },
  opts,
);

const SupportMessageSchema = new Schema(
  {
    ticketId: { ...ref('SupportTicket'), required: true, index: true },
    senderId: { ...ref('User'), required: true },
    senderName: String,
    senderRole: String,
    message: { type: String, required: true },
    attachments: { type: [String], default: [] },
    isInternal: { type: Boolean, default: false },
    readAt: Date,
  },
  opts,
);

/* --------------------------------------------------------------- Escalation */
const EscalationSchema = new Schema(
  {
    proposalId: { ...ref('Proposal'), required: true, index: true },
    fromRole: String,
    toRole: String,
    fromUserId: ref('User'),
    toUserId: ref('User'),
    reason: String,
    note: String,
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },
    respondedAt: Date,
    responseNote: String,
    dueAt: Date,
  },
  opts,
);

/* --------------------------------------------------------------- Resolution */
const ResolutionSchema = new Schema(
  {
    proposalId: { ...ref('Proposal'), required: true, index: true },
    resolutionId: { type: String, required: true, unique: true },
    summary: String,
    actionPlan: String,
    implementationStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed'],
      default: 'pending',
    },
    progressPercent: { type: Number, default: 0 },
    deadline: Date,
    resolvedBy: ref('User'),
    resolvedByName: String,
    resolvedAt: { type: Date, default: Date.now },
    updates: {
      type: [{ note: String, progressPercent: Number, at: Date, by: String }],
      default: [],
    },
  },
  opts,
);

/* -------------------------------------------------------- Management review */
const ManagementReviewSchema = new Schema(
  {
    proposalId: ref('Proposal'),
    reviewId: { type: String, required: true, unique: true },
    reviewType: { type: String, required: true },
    subject: String,
    submittedBy: ref('User'),
    submittedByName: String,
    community: { type: String, enum: ['student', 'teacher'], default: 'teacher' },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'findings_issued', 'closed'],
      default: 'submitted',
      index: true,
    },
    findings: String,
    recommendations: String,
    reviewedBy: ref('User'),
    reviewedByName: String,
    responseDeadline: Date,
    closedAt: Date,
  },
  opts,
);

/* -------------------------------------------------------------------- Audit */
const AuditEventSchema = new Schema(
  {
    userId: ref('User'),
    username: String,
    action: { type: String, required: true, index: true },
    entityType: String,
    entityId: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: String,
    userAgent: String,
  },
  opts,
);

/* -------------------------------------------------------------- CR messages */
const CrMessageSchema = new Schema(
  {
    studentId: { ...ref('User'), required: true, index: true },
    studentName: String,
    crId: ref('User'),
    classId: ref('Class'),
    senderId: { ...ref('User'), required: true },
    senderRole: String,
    senderName: String,
    body: { type: String, required: true },
    readAt: Date,
  },
  opts,
);

/* ------------------------------------------------------------------ Upload */
const UploadSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: String,
    mimeType: String,
    size: Number,
    path: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: ref('User'),
  },
  opts,
);

export const User: Model<any> = models.User || model('User', UserSchema);
export const Institution: Model<any> = models.Institution || model('Institution', InstitutionSchema);
export const Department: Model<any> = models.Department || model('Department', DepartmentSchema);
export const Class: Model<any> = models.Class || model('Class', ClassSchema);
export const Role: Model<any> = models.Role || model('Role', RoleSchema);
export const Permission: Model<any> = models.Permission || model('Permission', PermissionSchema);
export const RegistrationApproval: Model<any> =
  models.RegistrationApproval || model('RegistrationApproval', RegistrationApprovalSchema);
export const CRElection: Model<any> = models.CRElection || model('CRElection', CRElectionSchema);
export const CRCandidate: Model<any> = models.CRCandidate || model('CRCandidate', CRCandidateSchema);
export const CRAssignment: Model<any> = models.CRAssignment || model('CRAssignment', CRAssignmentSchema);
export const Proposal: Model<any> = models.Proposal || model('Proposal', ProposalSchema);
export const AnonymousBallot: Model<any> =
  models.AnonymousBallot || model('AnonymousBallot', AnonymousBallotSchema);
export const VotingAuthorization: Model<any> =
  models.VotingAuthorization || model('VotingAuthorization', VotingAuthorizationSchema);
export const Notification: Model<any> = models.Notification || model('Notification', NotificationSchema);
export const SupportTicket: Model<any> = models.SupportTicket || model('SupportTicket', SupportTicketSchema);
export const SupportMessage: Model<any> =
  models.SupportMessage || model('SupportMessage', SupportMessageSchema);
export const Escalation: Model<any> = models.Escalation || model('Escalation', EscalationSchema);
export const Resolution: Model<any> = models.Resolution || model('Resolution', ResolutionSchema);
export const ManagementReview: Model<any> =
  models.ManagementReview || model('ManagementReview', ManagementReviewSchema);
export const AuditEvent: Model<any> = models.AuditEvent || model('AuditEvent', AuditEventSchema);
export const CrMessage: Model<any> = models.CrMessage || model('CrMessage', CrMessageSchema);
export const Upload: Model<any> = models.Upload || model('Upload', UploadSchema);
