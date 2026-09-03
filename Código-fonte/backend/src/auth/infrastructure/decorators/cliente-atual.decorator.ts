import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extrai o id do Cliente autenticado (JwtStrategy.validate → request.user.id) —
 * usado nas rotas "me" (`/clientes/me/*`) pra nunca confiar num `:clienteId` de URL.
 * Só faz sentido atrás de `@Roles(PapelUsuario.CLIENTE)`, que já garante que
 * `request.user` é um Cliente autenticado, não um Usuario admin. */
export const ClienteAtual = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.user.id;
});
