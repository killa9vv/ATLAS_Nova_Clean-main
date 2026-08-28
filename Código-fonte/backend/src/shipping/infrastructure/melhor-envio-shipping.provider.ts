import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ShippingItem, ShippingProvider, ShippingQuote } from '../domain/shipping.types';

interface MelhorEnvioOption {
  id?: number;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  custom_delivery_time?: number;
  error?: string;
}

@Injectable()
export class MelhorEnvioShippingProvider extends ShippingProvider {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async cotar(
    cepOrigem: string,
    cepDestino: string,
    itens: ShippingItem[],
  ): Promise<ShippingQuote> {
    const token = this.configService.get<string>('MELHOR_ENVIO_TOKEN');

    const baseUrl =
      this.configService.get<string>('MELHOR_ENVIO_BASE_URL') ??
      'https://sandbox.melhorenvio.com.br';

    const userAgent = this.configService.get<string>('MELHOR_ENVIO_USER_AGENT');

    if (!token) {
      throw new Error('MELHOR_ENVIO_TOKEN não configurado.');
    }

    if (!userAgent) {
      throw new Error('MELHOR_ENVIO_USER_AGENT não configurado.');
    }

    const response = await axios.post<MelhorEnvioOption[]>(
      `${baseUrl}/api/v2/me/shipment/calculate`,
      {
        from: {
          postal_code: cepOrigem,
        },
        to: {
          postal_code: cepDestino,
        },
        products: itens.map((item) => ({
          id: item.produtoId,
          width: item.larguraCm,
          height: item.alturaCm,
          length: item.comprimentoCm,
          weight: item.pesoKg,
          insurance_value: item.valorUnitario,
          quantity: item.quantidade,
        })),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
        },
      },
    );

    const opcoesValidas = response.data
      .filter((opcao) => !opcao.error)
      .map((opcao) => {
        const preco = Number(opcao.custom_price ?? opcao.price);

        const prazo = opcao.custom_delivery_time ?? opcao.delivery_time;

        return {
          nome: opcao.name,
          preco,
          prazo,
        };
      })
      .filter((opcao) => Number.isFinite(opcao.preco) && opcao.preco >= 0);

    if (!opcoesValidas.length) {
      throw new Error('Nenhuma opção de frete válida foi retornada pelo Melhor Envio.');
    }

    const maisBarata = opcoesValidas.reduce((menor, atual) =>
      atual.preco < menor.preco ? atual : menor,
    );

    return {
      valor: maisBarata.preco,
      prazoDias: maisBarata.prazo,
      servico: maisBarata.nome,
    };
  }
}
