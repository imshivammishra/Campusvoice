import { SetMetadata } from '@nestjs/common';
import { Permission } from '@campusvoice/shared';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';
export const RequiredPermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
