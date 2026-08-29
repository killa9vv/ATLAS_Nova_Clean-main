import { Module } from '@nestjs/common';
import { FreteController } from './frete.controller';
import { CalcularFreteUseCase } from '../application/calcular-frete.use-case';
import { ShippingQuoteProvider } from '../domain/shipping-quote.port';
import { MelhorEnvioShippingQuoteProvider } from './gateways/melhor-envio.adapter';
import { TabelaRegionalShippingQuoteProvider } from './gateways/tabela-regional.adapter';
import { ShippingQuoteProviderComFallback } from './gateways/shipping-quote-com-fallback.adapter';
import { ShippingQuoteProviderComCache } from './gateways/shipping-quote-com-cache.adapter';
import {
  MELHOR_ENVIO_PROVIDER,
  SHIPPING_QUOTE_SEM_CACHE,
  TABELA_REGIONAL_PROVIDER,
} from './gateways/shipping-quote.tokens';

@Module({
  controllers: [FreteController],
  providers: [
    MelhorEnvioShippingQuoteProvider,
    TabelaRegionalShippingQuoteProvider,
    { provide: MELHOR_ENVIO_PROVIDER, useExisting: MelhorEnvioShippingQuoteProvider },
    { provide: TABELA_REGIONAL_PROVIDER, useExisting: TabelaRegionalShippingQuoteProvider },
    { provide: SHIPPING_QUOTE_SEM_CACHE, useClass: ShippingQuoteProviderComFallback },
    {
      provide: ShippingQuoteProvider,
      useFactory: (interno: ShippingQuoteProvider) => new ShippingQuoteProviderComCache(interno),
      inject: [SHIPPING_QUOTE_SEM_CACHE],
    },
    CalcularFreteUseCase,
  ],
  // ShippingQuoteProvider exportado caso algum outro módulo precise da mesma cotação
  // com fallback+cache, sem duplicar a lógica de decisão API-vs-tabela. CalcularFreteUseCase
  // exportado pro checkout (PedidosModule) reaproveitar a mesma regra de frete
  // grátis/opções ENTREGA-RETIRADA usada pelo endpoint público de cotação — o rateio
  // por item em si (ShippingAllocator) é decisão do checkout, não deste módulo.
  exports: [ShippingQuoteProvider, CalcularFreteUseCase],
})
export class FreteModule {}
