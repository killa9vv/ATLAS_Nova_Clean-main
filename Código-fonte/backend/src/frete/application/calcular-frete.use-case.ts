import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { formatoCepValido } from '../../shared/cep.util';
import { OpcaoFrete } from '../domain/frete.entity';
import { ShippingQuoteProvider } from '../domain/shipping-quote.port';
import { CepInvalidoException } from '../domain/frete.exceptions';

export interface CalcularFreteInput {
  cepDestino: string;
  quantidadeItens: number;
  valorDeclarado: number;
}

export interface CalcularFreteOutput {
  /** Sempre traz ENTREGA (valor pode ser 0 por frete grátis) e RETIRADA (sempre 0) — quem
   * decide entre as duas é o checkout, não este use case. Rateio entre itens do pedido
   * fica a cargo do ShippingService (card "Rateio automático de frete por CEP"). */
  opcoes: OpcaoFrete[];
}

@Injectable()
export class CalcularFreteUseCase {
  constructor(
    private readonly shippingQuoteProvider: ShippingQuoteProvider,
    private readonly configService: ConfigService,
  ) {}

  async executar(input: CalcularFreteInput): Promise<CalcularFreteOutput> {
    if (!formatoCepValido(input.cepDestino)) {
      throw new CepInvalidoException(input.cepDestino);
    }

    const cotacao = await this.shippingQuoteProvider.cotar({
      cepDestino: input.cepDestino,
      quantidadeItens: input.quantidadeItens,
      valorDeclarado: input.valorDeclarado,
    });

    // Configurável via env (FRETE_GRATIS_ACIMA_DE) — nunca fixo no código. Ausente =
    // frete grátis desligado (nenhum pedido se qualifica), não "grátis pra tudo".
    // Lido como string e convertido manualmente: ConfigService/Joi não garantem
    // coerção pra number sem @nestjs/config configurado com validationOptions
    // adicionais que este projeto não usa (ver PORT em main.ts, lido como string).
    const freteGratisAcimaDeRaw = this.configService.get<string>('FRETE_GRATIS_ACIMA_DE');
    const freteGratisAcimaDe = freteGratisAcimaDeRaw ? Number(freteGratisAcimaDeRaw) : undefined;
    const qualificaFreteGratis =
      freteGratisAcimaDe !== undefined && input.valorDeclarado >= freteGratisAcimaDe;

    return {
      opcoes: [
        new OpcaoFrete(
          'ENTREGA',
          qualificaFreteGratis ? 0 : cotacao.valor,
          cotacao.prazoEstimadoDias,
        ),
        new OpcaoFrete('RETIRADA', 0, 0),
      ],
    };
  }
}
