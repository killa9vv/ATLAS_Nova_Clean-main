import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { apenasDigitosCep } from '../../../shared/cep.util';
import { CotacaoFrete } from '../../domain/frete.entity';
import { ShippingQuoteProvider, SolicitacaoCotacaoFrete } from '../../domain/shipping-quote.port';

const MELHOR_ENVIO_API_URL = 'https://melhorenvio.com.br/api/v2';

// Dimensões de pacote padrão (cm) — o schema de Produto não tem peso/dimensão
// hoje (ver trade-offs), então usamos um pacote genérico conservador pra produtos
// de limpeza/papelaria de baixo ticket, escalando só o peso pela quantidade de itens.
const DIMENSAO_PADRAO_CM = { width: 16, height: 10, length: 20 };
const PESO_PADRAO_POR_ITEM_KG = 0.4;
const PESO_MINIMO_KG = 0.3;

interface OpcaoMelhorEnvio {
  price?: string | number;
  delivery_time?: number;
  error?: string;
}

/**
 * Implementação concreta de ShippingQuoteProvider via API do Melhor Envio.
 * Token de acesso pré-gerado no painel deles (mesma convenção do Mercado Pago
 * neste projeto — não implementamos o fluxo OAuth de obtenção/renovação do token).
 */
@Injectable()
export class MelhorEnvioShippingQuoteProvider extends ShippingQuoteProvider {
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    super();
    const token = this.configService.get<string>('MELHOR_ENVIO_TOKEN');
    this.http = axios.create({
      baseURL: MELHOR_ENVIO_API_URL,
      timeout: 8_000,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Exigido pela API do Melhor Envio em todas as chamadas.
        'User-Agent': 'Atlas Nova Clean (contato@atlasnovaclean.com.br)',
      },
    });
  }

  async cotar(solicitacao: SolicitacaoCotacaoFrete): Promise<CotacaoFrete> {
    const cepOrigem = this.configService.get<string>('FRETE_CEP_ORIGEM');
    if (!cepOrigem) {
      throw new Error('FRETE_CEP_ORIGEM não configurado — não é possível cotar via API externa.');
    }

    const peso = Math.max(PESO_MINIMO_KG, solicitacao.quantidadeItens * PESO_PADRAO_POR_ITEM_KG);

    const resposta = await this.http.post<OpcaoMelhorEnvio[]>('/me/shipment/calculate', {
      from: { postal_code: apenasDigitosCep(cepOrigem) },
      to: { postal_code: apenasDigitosCep(solicitacao.cepDestino) },
      products: [
        {
          id: 'carrinho',
          quantity: 1,
          weight: peso,
          insurance_value: solicitacao.valorDeclarado,
          ...DIMENSAO_PADRAO_CM,
        },
      ],
    });

    const opcoesValidas = resposta.data.filter(
      (opcao) => !opcao.error && opcao.price !== undefined,
    );
    if (!opcoesValidas.length) {
      throw new Error('Nenhuma opção de frete válida retornada pela API do Melhor Envio.');
    }

    const maisBarata = opcoesValidas.reduce((menor, atual) =>
      Number(atual.price) < Number(menor.price) ? atual : menor,
    );

    return new CotacaoFrete(Number(maisBarata.price), Number(maisBarata.delivery_time ?? 7), 'API');
  }
}
