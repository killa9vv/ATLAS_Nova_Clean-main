import { Injectable } from '@nestjs/common';
import { Resenha } from '../domain/resenha.entity';
import { ResenhaRepository } from '../domain/resenha.repository';

@Injectable()
export class ListarResenhasUseCase {
  constructor(private readonly resenhaRepository: ResenhaRepository) {}

  async executar(): Promise<Resenha[]> {
    return this.resenhaRepository.listarTodas();
  }
}
