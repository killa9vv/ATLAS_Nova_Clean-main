import { BadRequestException } from '@nestjs/common';
import { IsEmail, MinLength } from 'class-validator';
import { ValidationPipePtBr } from './validation-pipe-pt-br';

class LoginDeTeste {
  @IsEmail()
  email!: string;

  @MinLength(6)
  senha!: string;
}

describe('ValidationPipePtBr', () => {
  const pipe = new ValidationPipePtBr({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('devolve as mensagens de validação em português', async () => {
    const erro = await pipe
      .transform(
        { email: 'nao-e-email', senha: '123', extra: 1 },
        { type: 'body', metatype: LoginDeTeste },
      )
      .catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(BadRequestException);
    const { message } = (erro as BadRequestException).getResponse() as { message: string[] };
    expect(message).toEqual(
      expect.arrayContaining([
        'email deve ser um e-mail válido',
        'senha deve ter pelo menos 6 caracteres',
        'o campo extra não é permitido',
      ]),
    );
  });
});
