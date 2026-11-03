import { z } from 'zod';

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  department: z.string().min(1, 'Department is required'),
  course: z.string().min(1, 'Course is required'),
  academicYear: z.number().int().min(1).max(5),
  semester: z.number().int().min(1).max(10),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterTeacherSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterAuthoritySchema = z.object({
  designation: z.string().min(1, 'Designation is required'),
  authorityId: z.string().min(1, 'Authority ID is required'),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  institution: z.string().min(1, 'Institution is required'),
  role: z.enum([
    'SUPER_ADMIN', 'CHAIRMAN', 'VICE_CHAIRMAN', 'PRO_VICE_CHANCELLOR',
    'REGISTRAR', 'PRINCIPAL', 'HOD',
  ]),
  appointmentDetails: z.string().min(1, 'Appointment details are required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ProposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Type is required'),
  department: z.string().min(1, 'Department is required'),
  classId: z.string().optional(),
  proposedSolution: z.string().optional(),
  confidentiality: z.enum(['public', 'class', 'department', 'confidential']),
  audienceType: z.enum(['student', 'teacher', 'institution', 'class', 'department']),
  targetRole: z.string().optional(),
});

export const VoteSchema = z.object({
  ballotId: z.string().min(1, 'Ballot ID is required'),
  choice: z.enum(['support', 'oppose', 'abstain']),
  authorizationToken: z.string().min(1, 'Authorization token is required'),
});

export const EscalationSchema = z.object({
  proposalId: z.string().min(1, 'Proposal ID is required'),
  fromAuthority: z.string().min(1, 'From authority is required'),
  toAuthority: z.string().min(1, 'To authority is required'),
  action: z.string().min(1, 'Action is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export const SupportTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  recipientRole: z.string().optional(),
  recipientId: z.string().optional(),
  confidentiality: z.enum(['public', 'confidential']),
});

export const SupportMessageSchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required'),
  content: z.string().min(1, 'Content is required'),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterStudentInput = z.infer<typeof RegisterStudentSchema>;
export type RegisterTeacherInput = z.infer<typeof RegisterTeacherSchema>;
export type RegisterAuthorityInput = z.infer<typeof RegisterAuthoritySchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;
export type ProposalInput = z.infer<typeof ProposalSchema>;
export type VoteInput = z.infer<typeof VoteSchema>;
export type EscalationInput = z.infer<typeof EscalationSchema>;
export type SupportTicketInput = z.infer<typeof SupportTicketSchema>;
export type SupportMessageInput = z.infer<typeof SupportMessageSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
