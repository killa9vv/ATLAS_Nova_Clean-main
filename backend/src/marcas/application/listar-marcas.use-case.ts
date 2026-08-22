import { Injectable } from '@nestjs/common';
import { Marca } from '../domain/marca.entity';
import { MarcaRepository } from '../domain/marca.repository';

@Injectable()
export class ListarMarcasUseCase {
  constructor(private readonly marcaRepository: MarcaRepository) {}

  async executar(): Promise<Marca[]> {
    return this.marcaRepository.listarTodas();
  }
}
