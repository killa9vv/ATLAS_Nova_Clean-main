import { Module } from '@nestjs/common';
import { CuponsController } from './cupons.controller';
import { PrismaCupomRepository } from './prisma-cupom.repository';
import { CupomRepository } from '../domain/cupom.repository';
import { ListarCuponsUseCase } from '../application/listar-cupons.use-case';
import { CriarCupomUseCase } from '../application/criar-cupom.use-case';
import { AtualizarCupomUseCase } from '../application/atualizar-cupom.use-case';

@Module({
  controllers: [CuponsController],
  providers: [
    { provide: CupomRepository, useClass: PrismaCupomRepository },
    ListarCuponsUseCase,
    CriarCupomUseCase,
    AtualizarCupomUseCase,
  ],
  exports: [CupomRepository],
})
export class CuponsModule {}
