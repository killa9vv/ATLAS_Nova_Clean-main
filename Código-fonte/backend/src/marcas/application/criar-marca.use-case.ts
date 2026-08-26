import { Injectable } from '@nestjs/common';
import { Marca } from '../domain/marca.entity';
import { MarcaRepository } from '../domain/marca.repository';
import { MarcaDuplicadaException } from '../domain/marcas.exceptions';

@Injectable()
export class CriarMarcaUseCase {
  constructor(private readonly marcaRepository: MarcaRepository) {}

  async executar(nome: string): Promise<Marca> {
    if (await this.marcaRepository.buscarPorNome(nome)) {
      throw new MarcaDuplicadaException(nome);
    }
    return this.marcaRepository.criar(nome);
  }
}
