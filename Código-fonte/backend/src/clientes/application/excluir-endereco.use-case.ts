import { Injectable } from '@nestjs/common';
import { EnderecoRepository } from '../domain/endereco.repository';
import { EnderecoNaoEncontradoException } from '../domain/clientes.exceptions';

@Injectable()
export class ExcluirEnderecoUseCase {
  constructor(private readonly enderecoRepository: EnderecoRepository) {}

  async executar(id: string, clienteId: string): Promise<void> {
    const endereco = await this.enderecoRepository.buscarPorId(id);
    if (!endereco || endereco.clienteId !== clienteId) {
      throw new EnderecoNaoEncontradoException(id);
    }
    await this.enderecoRepository.excluir(id);
  }
}
