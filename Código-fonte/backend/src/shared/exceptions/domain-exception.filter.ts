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
    // 409 (não 404): mesmo padrão dos outros motivos de cupom abaixo — "código
    // digitado não existe" é tratado como o pedido de aplicar cupom conflitando
    // com o estado atual, não como uma rota/recurso REST que não foi encontrado
    // (contrato já estabelecido antes deste card — CUPOM_INVALIDO já era 409).
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
    ENDERECO_PADRAO_UNICO: 409,
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
