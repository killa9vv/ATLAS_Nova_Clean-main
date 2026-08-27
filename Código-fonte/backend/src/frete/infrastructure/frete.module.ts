import { Module } from '@nestjs/common';
import { FreteController } from './frete.controller';
import { CalcularFreteUseCase } from '../application/calcular-frete.use-case';
import { ShippingQuoteProvider } from '../domain/shipping-quote.port';
import { MelhorEnvioShippingQuoteProvider } from './gateways/melhor-envio.adapter';
import { TabelaRegionalShippingQuoteProvider } from './gateways/tabela-regional.adapter';
import { ShippingQuoteProviderComFallback } from './gateways/shipping-quote-com-fallback.adapter';
import { MELHOR_ENVIO_PROVIDER, TABELA_REGIONAL_PROVIDER } from './gateways/shipping-quote.tokens';

@Module({
  controllers: [FreteController],
  providers: [
    MelhorEnvioShippingQuoteProvider,
    TabelaRegionalShippingQuoteProvider,
    { provide: MELHOR_ENVIO_PROVIDER, useExisting: MelhorEnvioShippingQuoteProvider },
    { provide: TABELA_REGIONAL_PROVIDER, useExisting: TabelaRegionalShippingQuoteProvider },
    { provide: ShippingQuoteProvider, useClass: ShippingQuoteProviderComFallback },
    CalcularFreteUseCase,
  ],
  // ShippingQuoteProvider exportado pro futuro ShippingService (card "Rateio
  // automático de frete por CEP") poder injetar e reaproveitar a mesma cotação
  // com fallback, sem duplicar a lógica de decisão API-vs-tabela.
  exports: [ShippingQuoteProvider],
})
export class FreteModule {}
