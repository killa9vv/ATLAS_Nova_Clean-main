import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Igual a JwtAuthGuard, mas nunca bloqueia a requisição — usado em rotas públicas
 * que se comportam diferente quando há um cliente logado (ex: POST /pedidos, que
 * vincula o pedido a `request.user.id` quando autenticado, em vez de confiar num
 * `clienteId` de body). Token ausente ou inválido = segue como anônimo
 * (`request.user` fica undefined); token válido = `request.user` populado
 * normalmente pela JwtStrategy.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser | undefined {
    return err || !user ? undefined : user;
  }
}
