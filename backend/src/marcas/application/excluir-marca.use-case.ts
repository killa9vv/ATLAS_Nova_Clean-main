import { Injectable } from '@nestjs/common';
import { MarcaRepository } from '../domain/marca.repository';
import {
  MarcaComProdutosVinculadosException,
  MarcaNaoEncontradaException,
} from '../domain/marcas.exceptions';

@Injectable()
export class ExcluirMarcaUseCase {
  constructor(private readonly marcaRepository: MarcaRepository) {}

  async executar(id: string): Promise<void> {
    const existente = await this.marcaRepository.buscarPorId(id);
    if (!existente) {
      throw new MarcaNaoEncontradaException(id);
    }

    if (await this.marcaRepository.possuiProdutosVinculados(id)) {
      throw new MarcaComProdutosVinculadosException(id);
    }

    await this.marcaRepository.excluir(id);
  }
}
