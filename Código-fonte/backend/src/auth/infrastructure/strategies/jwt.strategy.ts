import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // ConfigService (não process.env direto) pelo mesmo motivo do
  // JwtModule.registerAsync em auth.module.ts — garante que JWT_SECRET já foi
  // carregado do .env quando isto é lido.
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: string; email: string; papel: string }) {
    return {
      id: payload.sub,
      email: payload.email,
      papel: payload.papel,
    };
  }
}
