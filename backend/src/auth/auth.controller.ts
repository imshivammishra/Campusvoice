import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Refresh token is scoped to the auth routes so it is only ever sent to the
// endpoints that need it. This MUST match the real route prefix (global prefix
// `api` + URI version `v1`), otherwise the browser never sends the cookie to
// the refresh/logout endpoints.
const REFRESH_COOKIE_PATH = '/api/v1/auth';

// When the frontend (e.g. Vercel) and backend are on different sites, browsers
// only send cookies on cross-site requests if they are SameSite=None; Secure.
// Enable this in production, or explicitly via COOKIE_CROSS_SITE=true.
const CROSS_SITE =
  process.env.COOKIE_CROSS_SITE === 'true' ||
  process.env.NODE_ENV === 'production';

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: CROSS_SITE, // Secure is required for SameSite=None
  sameSite: (CROSS_SITE ? 'none' : 'lax') as 'none' | 'lax',
};

const ACCESS_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: REFRESH_COOKIE_PATH,
};

const CLEAR_ACCESS_OPTIONS = { ...BASE_COOKIE_OPTIONS, path: '/' };
const CLEAR_REFRESH_OPTIONS = {
  ...BASE_COOKIE_OPTIONS,
  path: REFRESH_COOKIE_PATH,
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(
    @Body()
    body: {
      usernameOrEmail?: string;
      studentId?: string;
      email?: string;
      password: string;
    },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result =
      body.studentId && body.email
        ? await this.authService.loginStudent(
            body.studentId,
            body.email,
            body.password,
            req.ip,
            req.get('User-Agent'),
          )
        : await this.authService.login(
            body.usernameOrEmail || '',
            body.password,
            req.ip,
            req.get('User-Agent'),
          );

    res.cookie('cv_access_token', result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('cv_refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('sub') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['cv_refresh_token'];
    await this.authService.logout(userId, refreshToken);
    res.clearCookie('cv_access_token', CLEAR_ACCESS_OPTIONS);
    res.clearCookie('cv_refresh_token', CLEAR_REFRESH_OPTIONS);
    return { success: true };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Public()
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['cv_refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const result = await this.authService.refresh(refreshToken);

    res.cookie('cv_access_token', result.accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('cv_refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return { success: true };
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @Public()
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @Public()
  async confirmPasswordReset(@Body() body: { token: string; newPassword: string }) {
    return this.authService.confirmPasswordReset(body.token, body.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    return { user };
  }
}
