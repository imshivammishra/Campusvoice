export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CHAIRMAN: 'CHAIRMAN',
  VICE_CHAIRMAN: 'VICE_CHAIRMAN',
  PRO_VICE_CHANCELLOR: 'PRO_VICE_CHANCELLOR',
  REGISTRAR: 'REGISTRAR',
  PRINCIPAL: 'PRINCIPAL',
  HOD: 'HOD',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  CLASS_REPRESENTATIVE: 'CLASS_REPRESENTATIVE',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Users
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DEACTIVATE: 'users:deactivate',
  USERS_CREDENTIAL_RESET: 'users:credential-reset',
  // Elections
  ELECTIONS_CREATE: 'elections:create',
  ELECTIONS_VOTE: 'elections:vote',
  ELECTIONS_MANAGE: 'elections:manage',
  ELECTIONS_CERTIFY: 'elections:certify',
  // Proposals
  PROPOSALS_CREATE: 'proposals:create',
  PROPOSALS_REVIEW: 'proposals:review',
  PROPOSALS_PUBLISH: 'proposals:publish',
  PROPOSALS_VOTE: 'proposals:vote',
  PROPOSALS_FORWARD: 'proposals:forward',
  PROPOSALS_ESCALATE: 'proposals:escalate',
  // Management review
  MANAGEMENT_REVIEW_CREATE: 'management-review:create',
  MANAGEMENT_REVIEW_REVIEW: 'management-review:review',
  // Resolutions
  RESOLUTIONS_UPDATE: 'resolutions:update',
  // Audit
  AUDIT_READ: 'audit:read',
  // Institution
  INSTITUTION_CONFIGURE: 'institution:configure',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DEACTIVATE,
    PERMISSIONS.USERS_CREDENTIAL_RESET,
    PERMISSIONS.ELECTIONS_CREATE,
    PERMISSIONS.ELECTIONS_MANAGE,
    PERMISSIONS.ELECTIONS_CERTIFY,
    PERMISSIONS.PROPOSALS_CREATE,
    PERMISSIONS.PROPOSALS_REVIEW,
    PERMISSIONS.PROPOSALS_PUBLISH,
    PERMISSIONS.PROPOSALS_FORWARD,
    PERMISSIONS.PROPOSALS_ESCALATE,
    PERMISSIONS.MANAGEMENT_REVIEW_CREATE,
    PERMISSIONS.MANAGEMENT_REVIEW_REVIEW,
    PERMISSIONS.RESOLUTIONS_UPDATE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.INSTITUTION_CONFIGURE,
  ],
  CHAIRMAN: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PROPOSALS_FORWARD,
    PERMISSIONS.PROPOSALS_ESCALATE,
    PERMISSIONS.MANAGEMENT_REVIEW_REVIEW,
    PERMISSIONS.RESOLUTIONS_UPDATE,
    PERMISSIONS.AUDIT_READ,
  ],
  VICE_CHAIRMAN: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PROPOSALS_REVIEW,
    PERMISSIONS.PROPOSALS_FORWARD,
    PERMISSIONS.RESOLUTIONS_UPDATE,
  ],
  PRO_VICE_CHANCELLOR: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PROPOSALS_REVIEW,
    PERMISSIONS.PROPOSALS_FORWARD,
    PERMISSIONS.MANAGEMENT_REVIEW_REVIEW,
    PERMISSIONS.RESOLUTIONS_UPDATE,
  ],
  REGISTRAR: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DEACTIVATE,
    PERMISSIONS.USERS_CREDENTIAL_RESET,
    PERMISSIONS.AUDIT_READ,
  ],
  PRINCIPAL: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PROPOSALS_REVIEW,
    PERMISSIONS.PROPOSALS_FORWARD,
    PERMISSIONS.PROPOSALS_ESCALATE,
    PERMISSIONS.MANAGEMENT_REVIEW_REVIEW,
    PERMISSIONS.RESOLUTIONS_UPDATE,
  ],
  HOD: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PROPOSALS_REVIEW,
    PERMISSIONS.PROPOSALS_FORWARD,
    PERMISSIONS.RESOLUTIONS_UPDATE,
  ],
  TEACHER: [
    PERMISSIONS.PROPOSALS_CREATE,
    PERMISSIONS.PROPOSALS_VOTE,
    PERMISSIONS.PROPOSALS_FORWARD,
  ],
  STUDENT: [
    PERMISSIONS.ELECTIONS_VOTE,
    PERMISSIONS.PROPOSALS_VOTE,
  ],
  CLASS_REPRESENTATIVE: [
    PERMISSIONS.PROPOSALS_CREATE,
    PERMISSIONS.PROPOSALS_FORWARD,
    PERMISSIONS.PROPOSALS_PUBLISH,
  ],
} as const;

export const CONCERN_CATEGORIES = [
  'College Management',
  'Teacher-related concerns',
  'Administrative Problems',
  'Departmental Management',
  'Examination',
  'Internal Assessment',
  'Infrastructure',
  'Student Welfare',
  'Academic Policies',
  'Management Decisions',
  'Institutional Improvement',
  'Other',
] as const;

export const MANAGEMENT_PROPOSAL_TYPES = [
  'Improvement Request',
  'Formal Management Review',
  'Leadership Confidence Review',
  'Policy Change Request',
  'Administrative Restructuring',
  'Leadership Replacement Recommendation',
  'Institutional Accountability Proposal',
] as const;

export const ELECTION_STATUS = {
  SCHEDULED: 'scheduled',
  NOMINATION_OPEN: 'nomination_open',
  ACTIVE: 'active',
  CLOSED: 'closed',
  CERTIFIED: 'certified',
  CANCELLED: 'cancelled',
} as const;

export const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED_FOR_VOTING: 'approved_for_voting',
  VOTING_ACTIVE: 'voting_active',
  VOTING_CLOSED: 'voting_closed',
  CERTIFIED: 'certified',
  FORWARDED: 'forwarded',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const PROPOSAL_TYPE = {
  STUDENT_CONCERN: 'student_concern',
  TEACHER_PROPOSAL: 'teacher_proposal',
  MANAGEMENT_REVIEW: 'management_review',
  IMPROVEMENT_REQUEST: 'improvement_request',
} as const;

export const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_USER: 'waiting_user',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  ESCALATED: 'escalated',
} as const;

export const NOTIFICATION_TYPE = {
  ELECTION_OPENED: 'election_opened',
  ELECTION_REMINDER: 'election_reminder',
  ELECTION_RESULT: 'election_result',
  CR_APPOINTED: 'cr_appointed',
  NEW_PROPOSAL: 'new_proposal',
  VOTING_OPENED: 'voting_opened',
  VOTING_CLOSING: 'voting_closing',
  VOTING_RESULT: 'voting_result',
  TEACHER_RESPONSE: 'teacher_response',
  MANAGEMENT_REVIEW_UPDATE: 'management_review_update',
  ESCALATION: 'escalation',
  SUPPORT_REPLY: 'support_reply',
  RESOLUTION_UPDATE: 'resolution_update',
  ACCOUNT_ACTIVATION: 'account_activation',
  PASSWORD_RESET: 'password_reset',
} as const;

export const AUDIT_ACTION = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  APPROVE_REGISTRATION: 'approve_registration',
  DEACTIVATE_ACCOUNT: 'deactivate_account',
  CREDENTIAL_RESET: 'credential_reset',
  VOTE: 'vote',
  CREATE_PROPOSAL: 'create_proposal',
  FORWARD_PROPOSAL: 'forward_proposal',
  ESCALATE: 'escalate',
  RESOLVE: 'resolve',
  CR_ASSIGN: 'cr_assign',
  CR_REVOKE: 'cr_revoke',
  ACCOUNT_UPDATE: 'account_update',
} as const;

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'cv_access_token',
  REFRESH_TOKEN: 'cv_refresh_token',
  CSRF_TOKEN: 'cv_csrf_token',
} as const;
