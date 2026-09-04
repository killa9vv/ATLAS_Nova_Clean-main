import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Espelha `sessionToken` do corpo da resposta pro header `X-Cart-Session` — o corpo
 * já é a fonte da verdade que o frontend consome; isto é só um espelho auxiliar. */
@Injectable()
export class SessaoCarrinhoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((corpo: unknown) => {
        const sessionToken = (corpo as { sessionToken?: string } | undefined)?.sessionToken;
        if (sessionToken) {
          response.setHeader('X-Cart-Session', sessionToken);
        }
        return corpo;
      }),
    );
  }
}
