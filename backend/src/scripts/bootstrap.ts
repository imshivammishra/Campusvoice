import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import argon2 from 'argon2';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const usersService = app.get(UsersService);

  const adminUsername = process.env.ADMIN_USERNAME || 'super_admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusvoice.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'SuperAdmin123!';

  const existing = await usersService.findByUsernameOrEmail(adminUsername);
  if (existing) {
    // Activate if deactivated
    if (!existing.isActive) {
      await usersService.activate(existing._id.toString());
      console.log('Super admin reactivated.');
    }
    // Reset password to ensure it matches
    const passwordHash = await argon2.hash(adminPassword);
    await usersService.updatePassword(existing._id.toString(), passwordHash);
    console.log('Super admin password reset.');
    console.log('Super admin already exists. Skipping bootstrap.');
    await app.close();
    return;
  }

  await usersService.create({
    username: adminUsername,
    email: adminEmail,
    passwordHash: adminPassword,
    fullName: 'Super Administrator',
    role: 'SUPER_ADMIN',
    permissions: [
      'users:create', 'users:read', 'users:update', 'users:deactivate', 'users:credential-reset',
      'elections:create', 'elections:vote', 'elections:manage', 'elections:certify',
      'proposals:create', 'proposals:review', 'proposals:publish', 'proposals:vote', 'proposals:forward', 'proposals:escalate',
      'management-review:create', 'management-review:review',
      'resolutions:update',
      'audit:read',
      'institution:configure',
    ],
    institutionId: undefined,
    isActive: true,
    isEmailVerified: true,
    cannotChangeUsername: false,
    cannotChangePassword: false,
  });

  console.log('Super admin bootstrapped successfully.');
  console.log(`Username: ${adminUsername}`);
  console.log(`Password: ${adminPassword}`);
  console.log('IMPORTANT: Change the default password after first login.');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
