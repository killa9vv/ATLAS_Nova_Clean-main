import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginUseCase } from '../application/login.use-case';
import { LoginDto } from '../application/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  // Limite bem mais apertado que o padrão da API: login é o alvo natural de
  // força bruta/credential stuffing.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.loginUseCase.execute(body);
  }
}
