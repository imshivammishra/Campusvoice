import { Injectable } from '@nestjs/common';

@Injectable()
export class TeachersService {
  getDashboardData() {
    return { message: 'Teacher governance dashboard' };
  }
}
