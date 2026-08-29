import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { apenasDigitosCep } from '../../../shared/cep.util';
import { CotacaoFrete } from '../../domain/frete.entity';
import {
  ItemCotacaoFrete,
  ShippingQuoteProvider,
  SolicitacaoCotacaoFrete,
} from '../../domain/shipping-quote.port';

const MELHOR_ENVIO_API_URL_PADRAO = 'https://melhorenvio.com.br/api/v2';

// Dimensões/peso usados quando o produto não tem dados físicos cadastrados ainda
// (Produto.pesoKg/alturaCm/larguraCm/comprimentoCm são opcionais — catálogo legado).
// Nesse caso monta UM pacote sintético pro carrinho inteiro, escalando o peso pela
// quantidade de itens. Quando todo item tem dados físicos reais, usa um pacote por
// produto (mais preciso, é o que a API do Melhor Envio espera de verdade).
const DIMENSAO_PADRAO_CM = { width: 16, height: 10, length: 20 };
const PESO_PADRAO_POR_ITEM_KG = 0.4;
const PESO_MINIMO_KG = 0.3;

interface OpcaoMelhorEnvio {
  price?: string | number;
  delivery_time?: number;
  error?: string;
}

interface PacoteMelhorEnvio {
  id: string;
  quantity: number;
  weight: number;
  insurance_value: number;
  width: number;
  height: number;
  length: number;
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
    // Vazio/ausente = API de produção. Configurável pra apontar pro sandbox deles em dev.
    const baseURL =
      this.configService.get<string>('MELHOR_ENVIO_BASE_URL') || MELHOR_ENVIO_API_URL_PADRAO;
    this.http = axios.create({
      baseURL,
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

    const resposta = await this.http.post<OpcaoMelhorEnvio[]>('/me/shipment/calculate', {
      from: { postal_code: apenasDigitosCep(cepOrigem) },
      to: { postal_code: apenasDigitosCep(solicitacao.cepDestino) },
      products: this.montarPacotes(solicitacao),
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

  /** Um pacote por produto quando todos têm dados físicos reais cadastrados; senão,
   * cai pro pacote sintético único (comportamento anterior, produto sem esses dados). */
  private montarPacotes(solicitacao: SolicitacaoCotacaoFrete): PacoteMelhorEnvio[] {
    const itensComDadosReais = solicitacao.itens?.filter(possuiDadosFisicosValidos);

    if (itensComDadosReais?.length === solicitacao.itens?.length && itensComDadosReais?.length) {
      return itensComDadosReais.map((item) => ({
        id: item.produtoId,
        quantity: item.quantidade,
        weight: item.pesoKg!,
        insurance_value: solicitacao.valorDeclarado,
        width: item.larguraCm!,
        height: item.alturaCm!,
        length: item.comprimentoCm!,
      }));
    }

    const peso = Math.max(PESO_MINIMO_KG, solicitacao.quantidadeItens * PESO_PADRAO_POR_ITEM_KG);
    return [
      {
        id: 'carrinho',
        quantity: 1,
        weight: peso,
        insurance_value: solicitacao.valorDeclarado,
        ...DIMENSAO_PADRAO_CM,
      },
    ];
  }
}

function possuiDadosFisicosValidos(item: ItemCotacaoFrete): boolean {
  return Boolean(
    item.pesoKg &&
    item.pesoKg > 0 &&
    item.alturaCm &&
    item.alturaCm > 0 &&
    item.larguraCm &&
    item.larguraCm > 0 &&
    item.comprimentoCm &&
    item.comprimentoCm > 0,
  );
}
