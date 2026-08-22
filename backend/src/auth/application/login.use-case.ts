import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const senhaValida = await bcrypt.compare(input.senha, usuario.senhaHash);

    if (!senhaValida) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      papel: usuario.papel,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
      },
    };
  }
}
