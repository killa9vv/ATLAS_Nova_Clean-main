import { Module } from '@nestjs/common';
import { MarcasController } from './marcas.controller';
import { PrismaMarcaRepository } from './prisma-marca.repository';
import { MarcaRepository } from '../domain/marca.repository';
import { ListarMarcasUseCase } from '../application/listar-marcas.use-case';
import { CriarMarcaUseCase } from '../application/criar-marca.use-case';
import { AtualizarMarcaUseCase } from '../application/atualizar-marca.use-case';
import { ExcluirMarcaUseCase } from '../application/excluir-marca.use-case';

@Module({
  controllers: [MarcasController],
  providers: [
    { provide: MarcaRepository, useClass: PrismaMarcaRepository },
    ListarMarcasUseCase,
    CriarMarcaUseCase,
    AtualizarMarcaUseCase,
    ExcluirMarcaUseCase,
  ],
  exports: [MarcaRepository],
})
export class MarcasModule {}
