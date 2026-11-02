import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { PinoLoggerService } from './pino-logger.service';
import type { RequestComId } from './request-logging.interceptor';

interface ErroNormalizado {
  statusCode: number;
  erro: string;
  mensagem: string | string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
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
    PRECO_PROMOCIONAL_INVALIDO: 400,
    CLIENTE_NAO_ENCONTRADO: 404,
    DOCUMENTO_INVALIDO: 400,
    ENDERECO_NAO_ENCONTRADO: 404,
    CEP_INVALIDO: 400,
    CEP_NAO_ENCONTRADO: 404,
    CEP_INDISPONIVEL: 503,
    CUPOM_NAO_ENCONTRADO: 404,
    CUPOM_VALOR_INVALIDO: 400,
    CUPOM_CODIGO_DUPLICADO: 409,
    CUPOM_CODIGO_INVALIDO: 409,
    CUPOM_INATIVO: 409,
    CUPOM_EXPIRADO: 409,
    CUPOM_ESGOTADO: 409,
    CUPOM_VALOR_MINIMO_NAO_ATINGIDO: 409,
    CUPOM_NAO_APLICAVEL_ITENS: 409,
    CUPOM_LIMITE_USO_CLIENTE_EXCEDIDO: 409,
    REGRA_ATACADO_NAO_ENCONTRADA: 404,
    REGRA_ATACADO_VALOR_INVALIDO: 400,
    REGRA_ATACADO_ALVO_INVALIDO: 400,
    BANNER_NAO_ENCONTRADO: 404,
    CREDENCIAIS_INVALIDAS: 401,
    TOKEN_RECUPERACAO_INVALIDO: 400,
    EMAIL_JA_CADASTRADO: 409,
    SENHA_ATUAL_INCORRETA: 403,
    EMAIL_IGUAL_AO_ATUAL: 400,
    TOKEN_TROCA_EMAIL_INVALIDO: 400,
    ENDERECO_PADRAO_UNICO: 409,
  };

  constructor(private readonly logger: PinoLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestComId>();
    const response = http.getResponse<Response>();

    const erro = this.normalizar(exception);

    if (erro.statusCode >= 500) {
      this.logger.error({
        event: 'http_request_error',
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode: erro.statusCode,
        erro: erro.erro,
        exception:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : undefined,
      });
    }

    response.status(erro.statusCode).json({
      ...erro,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    });
  }

  private normalizar(exception: unknown): ErroNormalizado {
    if (exception instanceof DomainException) {
      const statusCode =
        GlobalExceptionFilter.STATUS_POR_CODIGO[exception.code] ?? HttpStatus.BAD_REQUEST;

      return {
        statusCode,
        erro: exception.code,
        mensagem: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const resposta = exception.getResponse();

      if (typeof resposta === 'string') {
        return {
          statusCode,
          erro: this.codigoHttp(statusCode),
          mensagem: resposta,
        };
      }

      const objeto = resposta as {
        message?: string | string[];
        error?: string;
      };

      return {
        statusCode,
        erro:
          statusCode === HttpStatus.BAD_REQUEST ? 'VALIDACAO_FALHOU' : this.codigoHttp(statusCode),
        mensagem: objeto.message ?? exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      erro: 'ERRO_INTERNO',
      mensagem: 'Erro interno do servidor.',
    };
  }

  private codigoHttp(status: number): string {
    const nome = HttpStatus[status];

    if (typeof nome === 'string') {
      return nome;
    }

    return `HTTP_${status}`;
  }
}
