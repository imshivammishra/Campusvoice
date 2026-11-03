import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'usernameOrEmail',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: any, usernameOrEmail: string, password: string) {
    // Local strategy is not used directly; auth.service.login handles it
    throw new UnauthorizedException('Use /auth/login endpoint');
  }
}
