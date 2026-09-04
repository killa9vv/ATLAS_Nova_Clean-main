import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Lê o token de sessão do carrinho do header `X-Cart-Session` — Express normaliza
 * nomes de header pra lowercase em `request.headers`, por isso o literal em minúsculo. */
export const SessaoCarrinhoToken = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const valor = request.headers['x-cart-session'];
    return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
  },
);
