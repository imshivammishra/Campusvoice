import { Role, Permission } from '../constants';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: Role;
  permissions: Permission[];
  institutionId: string;
  departmentId?: string;
  classId?: string;
  type: 'access' | 'refresh';
  jti: string;
}

export interface UserIdentity {
  id: string;
  username: string;
  email: string;
  role: Role;
  permissions: Permission[];
  institutionId: string;
  departmentId?: string;
  classId?: string;
  isActive: boolean;
  isEmailVerified: boolean;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}
