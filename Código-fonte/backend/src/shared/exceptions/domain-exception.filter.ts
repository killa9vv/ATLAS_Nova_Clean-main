import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from './domain.exception';

/**
 * Traduz exceções de domínio (sem nenhum conhecimento de HTTP) para respostas HTTP.
 * Novos códigos de erro devem ser registrados aqui — o domínio nunca decide status HTTP.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private static readonly STATUS_POR_CODIGO: Record<string, number> = {
    PEDIDO_NAO_ENCONTRADO: 404,
    PAGAMENTO_NAO_ENCONTRADO: 404,
    PRODUTO_NAO_ENCONTRADO: 404,
    ESTOQUE_INSUFICIENTE: 409,
    CARRINHO_VAZIO: 400,
    PEDIDO_EM_STATUS_INVALIDO: 409,
    PAGAMENTO_RECUSADO: 402,
    GATEWAY_INDISPONIVEL: 503,
    CREDENCIAIS_GATEWAY_INVALIDAS: 502,
    PAGAMENTO_DUPLICADO: 409,
    CATEGORIA_NAO_ENCONTRADA: 404,
    CATEGORIA_COM_PRODUTOS_VINCULADOS: 409,
    MARCA_NAO_ENCONTRADA: 404,
    MARCA_COM_PRODUTOS_VINCULADOS: 409,
    MARCA_DUPLICADA: 409,
    IMAGEM_PRODUTO_NAO_ENCONTRADA: 404,
  };

  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = DomainExceptionFilter.STATUS_POR_CODIGO[exception.code] ?? 400;

    if (status >= 500) {
      this.logger.error(`${exception.code}: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      erro: exception.code,
      mensagem: exception.message,
    });
  }
}
