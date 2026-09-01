import { Injectable } from '@nestjs/common';
import { Resenha } from '../domain/resenha.entity';
import { DadosCriacaoResenha, ResenhaRepository } from '../domain/resenha.repository';

@Injectable()
export class CriarResenhaUseCase {
  constructor(private readonly resenhaRepository: ResenhaRepository) {}

  async executar(dados: DadosCriacaoResenha): Promise<Resenha> {
    return this.resenhaRepository.criar(dados);
  }
}
