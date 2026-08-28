import { Module } from '@nestjs/common';
import { ShippingProvider } from '../domain/shipping.types';
import { ShippingService } from '../domain/shipping.service';
import { MelhorEnvioShippingProvider } from './melhor-envio-shipping.provider';

@Module({
  providers: [
    ShippingService,
    {
      provide: ShippingProvider,
      useClass: MelhorEnvioShippingProvider,
    },
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
