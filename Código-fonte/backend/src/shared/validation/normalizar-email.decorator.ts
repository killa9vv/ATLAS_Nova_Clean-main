import { Transform } from 'class-transformer';

/**
 * E-mail sempre em minúsculas e sem espaços nas pontas, antes de validar e de
 * chegar no use case — "Gabriel@Gmail.com" e "gabriel@gmail.com" são a mesma
 * pessoa. Sem isso, a conta criada com uma grafia não era encontrada no login ou
 * na recuperação de senha digitados com outra. Cadastros antigos gravados com
 * maiúsculas continuam sendo achados porque as buscas por e-mail também ignoram
 * maiúsculas/minúsculas (ver PrismaClienteRepository.buscarPorEmail).
 */
export function NormalizarEmail(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
}
