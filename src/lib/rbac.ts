export const ROLES = [
  'SUPER_ADMIN',
  'CHAIRMAN',
  'VICE_CHAIRMAN',
  'PRO_VICE_CHANCELLOR',
  'REGISTRAR',
  'PRINCIPAL',
  'HOD',
  'TEACHER',
  'STUDENT',
  'CLASS_REPRESENTATIVE',
] as const;

export type Role = (typeof ROLES)[number];

export const AUTHORITY_ROLES: Role[] = [
  'SUPER_ADMIN',
  'CHAIRMAN',
  'VICE_CHAIRMAN',
  'PRO_VICE_CHANCELLOR',
  'REGISTRAR',
  'PRINCIPAL',
  'HOD',
];

export function roleLabel(role?: string): string {
  if (!role) return 'User';
  return role
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: 'Full platform administration and configuration.',
  CHAIRMAN: 'Top governing authority; reviews escalations and management reviews.',
  VICE_CHAIRMAN: 'Reviews and forwards proposals; supports the chairman.',
  PRO_VICE_CHANCELLOR: 'Academic leadership; reviews proposals and management reviews.',
  REGISTRAR: 'Manages accounts, approvals and credential resets.',
  PRINCIPAL: 'Institutional head; reviews and escalates proposals.',
  HOD: 'Head of Department; reviews departmental proposals.',
  TEACHER: 'Faculty member; creates and votes on proposals.',
  STUDENT: 'Votes in elections and on proposals.',
  CLASS_REPRESENTATIVE: 'Elected student rep; forwards and publishes class proposals.',
};

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'users:create': 'Create new user and authority accounts',
  'users:read': 'View user accounts and directories',
  'users:update': 'Update roles, permissions and profiles',
  'users:deactivate': 'Deactivate or suspend accounts',
  'users:credential-reset': 'Issue temporary password resets',
  'elections:create': 'Create CR elections',
  'elections:vote': 'Cast votes in elections',
  'elections:manage': 'Manage election lifecycle',
  'elections:certify': 'Certify election results',
  'proposals:create': 'Create concerns and proposals',
  'proposals:review': 'Review submitted proposals',
  'proposals:publish': 'Publish proposals for voting',
  'proposals:vote': 'Vote on proposals',
  'proposals:forward': 'Forward proposals up the hierarchy',
  'proposals:escalate': 'Escalate proposals to higher authorities',
  'management-review:create': 'Create management accountability reviews',
  'management-review:review': 'Review management accountability reports',
  'resolutions:update': 'Update resolution and implementation status',
  'audit:read': 'View security and audit logs',
  'institution:configure': 'Configure institutions, departments and classes',
};

// Mirrors the backend ROLE_PERMISSIONS matrix in @campusvoice/shared.
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'users:create',
    'users:read',
    'users:update',
    'users:deactivate',
    'users:credential-reset',
    'elections:create',
    'elections:manage',
    'elections:certify',
    'proposals:create',
    'proposals:review',
    'proposals:publish',
    'proposals:forward',
    'proposals:escalate',
    'management-review:create',
    'management-review:review',
    'resolutions:update',
    'audit:read',
    'institution:configure',
  ],
  CHAIRMAN: [
    'users:read',
    'proposals:forward',
    'proposals:escalate',
    'management-review:review',
    'resolutions:update',
    'audit:read',
  ],
  VICE_CHAIRMAN: [
    'users:read',
    'proposals:review',
    'proposals:forward',
    'resolutions:update',
  ],
  PRO_VICE_CHANCELLOR: [
    'users:read',
    'proposals:review',
    'proposals:forward',
    'management-review:review',
    'resolutions:update',
  ],
  REGISTRAR: [
    'users:create',
    'users:read',
    'users:update',
    'users:deactivate',
    'users:credential-reset',
    'audit:read',
  ],
  PRINCIPAL: [
    'users:read',
    'proposals:review',
    'proposals:forward',
    'proposals:escalate',
    'management-review:review',
    'resolutions:update',
  ],
  HOD: [
    'users:read',
    'proposals:review',
    'proposals:forward',
    'resolutions:update',
  ],
  TEACHER: ['proposals:create', 'proposals:vote', 'proposals:forward'],
  STUDENT: ['elections:vote', 'proposals:vote'],
  CLASS_REPRESENTATIVE: [
    'proposals:create',
    'proposals:forward',
    'proposals:publish',
  ],
};

export function canAccessAdmin(permissions?: string[]): boolean {
  if (!permissions) return false;
  return (
    permissions.includes('users:read') ||
    permissions.includes('institution:configure') ||
    permissions.includes('audit:read')
  );
}
