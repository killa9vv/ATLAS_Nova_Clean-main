import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LoginUseCase } from '../application/login.use-case';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [LoginUseCase, JwtStrategy, RolesGuard],
  exports: [JwtModule, PassportModule, JwtStrategy, RolesGuard],
})
export class AuthModule {}
