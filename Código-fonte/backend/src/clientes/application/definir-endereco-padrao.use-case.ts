import { Injectable } from '@nestjs/common';
import { Endereco } from '../domain/endereco.entity';
import { EnderecoRepository } from '../domain/endereco.repository';
import { EnderecoNaoEncontradoException } from '../domain/clientes.exceptions';

@Injectable()
export class DefinirEnderecoPadraoUseCase {
  constructor(private readonly enderecoRepository: EnderecoRepository) {}

  async executar(id: string, clienteId: string): Promise<Endereco> {
    const endereco = await this.enderecoRepository.buscarPorId(id);
    if (!endereco || endereco.clienteId !== clienteId) {
      throw new EnderecoNaoEncontradoException(id);
    }
    return this.enderecoRepository.definirComoPadrao(id, clienteId);
  }
}
