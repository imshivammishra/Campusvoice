import { Injectable } from '@nestjs/common';
import { PERMISSIONS } from '@campusvoice/shared';

@Injectable()
export class PermissionsService {
  getAll() {
    return Object.values(PERMISSIONS);
  }

  getMatrix() {
    return {
      SUPER_ADMIN: ['*'],
      // Documented permission matrix
    };
  }
}
