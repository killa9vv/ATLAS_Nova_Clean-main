import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    // registerAsync (não register) de propósito: register() leria
    // process.env.JWT_SECRET na avaliação do decorator @Module, que acontece
    // durante a cadeia de imports — antes do ConfigModule.forRoot() (em
    // AppModule) ter rodado o dotenv e populado process.env a partir do
    // .env. Isso quebrava login em dev local (funcionava só em CI/testes
    // porque lá JWT_SECRET já vem setado como env var do shell, não do
    // .env). ConfigService injetado aqui é sempre lido depois do dotenv.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [LoginUseCase, JwtStrategy, RolesGuard],
  exports: [JwtModule, PassportModule, JwtStrategy, RolesGuard],
})
export class AuthModule {}
