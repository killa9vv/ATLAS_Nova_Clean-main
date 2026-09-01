import { Module } from '@nestjs/common';
import { ResenhasController } from './resenhas.controller';
import { PrismaResenhaRepository } from './prisma-resenha.repository';
import { ResenhaRepository } from '../domain/resenha.repository';
import { ListarResenhasUseCase } from '../application/listar-resenhas.use-case';
import { CriarResenhaUseCase } from '../application/criar-resenha.use-case';

@Module({
  controllers: [ResenhasController],
  providers: [
    { provide: ResenhaRepository, useClass: PrismaResenhaRepository },
    ListarResenhasUseCase,
    CriarResenhaUseCase,
  ],
  exports: [ResenhaRepository],
})
export class ResenhasModule {}
