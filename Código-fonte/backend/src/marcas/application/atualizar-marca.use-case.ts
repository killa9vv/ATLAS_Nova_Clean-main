import { Injectable } from '@nestjs/common';
import { Marca } from '../domain/marca.entity';
import { MarcaRepository } from '../domain/marca.repository';
import { MarcaDuplicadaException, MarcaNaoEncontradaException } from '../domain/marcas.exceptions';

@Injectable()
export class AtualizarMarcaUseCase {
  constructor(private readonly marcaRepository: MarcaRepository) {}

  async executar(id: string, nome: string): Promise<Marca> {
    const existente = await this.marcaRepository.buscarPorId(id);
    if (!existente) {
      throw new MarcaNaoEncontradaException(id);
    }

    const comMesmoNome = await this.marcaRepository.buscarPorNome(nome);
    if (comMesmoNome && comMesmoNome.id !== id) {
      throw new MarcaDuplicadaException(nome);
    }

    return this.marcaRepository.atualizar(id, nome);
  }
}
