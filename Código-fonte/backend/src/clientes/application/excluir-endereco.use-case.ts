import { Injectable } from '@nestjs/common';
import { EnderecoRepository } from '../domain/endereco.repository';
import {
  EnderecoNaoEncontradoException,
  EnderecoPadraoUnicoException,
} from '../domain/clientes.exceptions';

@Injectable()
export class ExcluirEnderecoUseCase {
  constructor(private readonly enderecoRepository: EnderecoRepository) {}

  async executar(id: string, clienteId: string): Promise<void> {
    const endereco = await this.enderecoRepository.buscarPorId(id);
    if (!endereco || endereco.clienteId !== clienteId) {
      throw new EnderecoNaoEncontradoException(id);
    }

    const enderecos = await this.enderecoRepository.listarPorCliente(clienteId);

    if (endereco.padrao && enderecos.length === 1) {
      throw new EnderecoPadraoUnicoException();
    }

    await this.enderecoRepository.excluir(id);

    // Excluir o padrão havendo outros não pode deixar o cliente sem nenhum padrão —
    // promove um dos restantes automaticamente, sem exigir uma segunda chamada do
    // cliente. Endereco não guarda timestamp, então "qual" é arbitrário (o primeiro
    // da mesma ordenação usada em listarPorCliente).
    if (endereco.padrao) {
      const restantes = enderecos.filter((e) => e.id !== id);
      await this.enderecoRepository.definirComoPadrao(restantes[0].id, clienteId);
    }
  }
}
