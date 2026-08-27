import { Injectable } from '@nestjs/common';
import { apenasDigitosCep } from '../../../shared/cep.util';
import { CotacaoFrete } from '../../domain/frete.entity';
import { ShippingQuoteProvider, SolicitacaoCotacaoFrete } from '../../domain/shipping-quote.port';

/**
 * Faixas de CEP por região, dos 5 primeiros dígitos — pensadas pro recorte regional
 * do MVP (Campos dos Goytacazes/RJ e entorno). Servem de:
 * 1) provedor único enquanto MELHOR_ENVIO_TOKEN não está configurado (dev local);
 * 2) contingência do ShippingQuoteProviderComFallback quando a API externa falha.
 * Nunca deixa de responder pra um CEP de formato válido — a última faixa cobre
 * "resto do Brasil" com um valor mais conservador, propositalmente simples pro MVP.
 */
interface FaixaFrete {
  prefixoMinimo: number;
  prefixoMaximo: number;
  valor: number;
  prazoEstimadoDias: number;
}

const FAIXAS: FaixaFrete[] = [
  // Campos dos Goytacazes e distritos vizinhos — entrega local (motoboy/própria).
  { prefixoMinimo: 28000, prefixoMaximo: 28090, valor: 12, prazoEstimadoDias: 1 },
  // Resto do estado do Rio de Janeiro.
  { prefixoMinimo: 20000, prefixoMaximo: 28999, valor: 25, prazoEstimadoDias: 3 },
];
const VALOR_FORA_DA_REGIAO = 45;
const PRAZO_FORA_DA_REGIAO_DIAS = 7;

@Injectable()
export class TabelaRegionalShippingQuoteProvider extends ShippingQuoteProvider {
  async cotar(solicitacao: SolicitacaoCotacaoFrete): Promise<CotacaoFrete> {
    const prefixo = Number(apenasDigitosCep(solicitacao.cepDestino).slice(0, 5));

    const faixa = FAIXAS.find((f) => prefixo >= f.prefixoMinimo && prefixo <= f.prefixoMaximo);

    if (faixa) {
      return new CotacaoFrete(faixa.valor, faixa.prazoEstimadoDias, 'TABELA_REGIONAL');
    }
    return new CotacaoFrete(VALOR_FORA_DA_REGIAO, PRAZO_FORA_DA_REGIAO_DIAS, 'TABELA_REGIONAL');
  }
}
