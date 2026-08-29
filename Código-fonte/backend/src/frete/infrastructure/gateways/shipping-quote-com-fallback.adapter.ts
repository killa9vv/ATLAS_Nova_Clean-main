import { Inject, Injectable, Logger } from '@nestjs/common';
import { CotacaoFrete } from '../../domain/frete.entity';
import { ShippingQuoteProvider, SolicitacaoCotacaoFrete } from '../../domain/shipping-quote.port';
import { MELHOR_ENVIO_PROVIDER, TABELA_REGIONAL_PROVIDER } from './shipping-quote.tokens';

/**
 * Composite/decorator: tenta a cotação real (Melhor Envio) e, se falhar por
 * qualquer motivo (timeout, erro de rede, credencial ausente/inválida, resposta
 * sem opção válida), cai pra tabela regional — que nunca falha pra um CEP de
 * formato válido. É esta classe (não os dois adapters individualmente) que fica
 * registrada como `ShippingQuoteProvider` no módulo, então a aplicação nunca
 * escolhe entre os dois: sempre recebe uma cotação coerente.
 */
@Injectable()
export class ShippingQuoteProviderComFallback extends ShippingQuoteProvider {
  private readonly logger = new Logger(ShippingQuoteProviderComFallback.name);

  constructor(
    @Inject(MELHOR_ENVIO_PROVIDER) private readonly principal: ShippingQuoteProvider,
    @Inject(TABELA_REGIONAL_PROVIDER) private readonly contingencia: ShippingQuoteProvider,
  ) {
    super();
  }

  async cotar(solicitacao: SolicitacaoCotacaoFrete): Promise<CotacaoFrete> {
    try {
      return await this.principal.cotar(solicitacao);
    } catch (erro) {
      this.logger.warn(
        `Cotação via API externa de frete falhou, usando tabela regional como contingência: ${
          erro instanceof Error ? erro.message : String(erro)
        }`,
      );
      return this.contingencia.cotar(solicitacao);
    }
  }
}
