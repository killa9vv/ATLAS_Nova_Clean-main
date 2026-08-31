import { Injectable } from '@nestjs/common';
import { Cupom } from '../domain/cupom.entity';
import { CupomRepository } from '../domain/cupom.repository';

@Injectable()
export class ListarCuponsUseCase {
  constructor(private readonly cupomRepository: CupomRepository) {}

  async executar(): Promise<Cupom[]> {
    return this.cupomRepository.listarTodos();
  }
}
