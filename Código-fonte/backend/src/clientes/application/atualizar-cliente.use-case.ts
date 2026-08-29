import { Injectable } from '@nestjs/common';
import { Cliente } from '../domain/cliente.entity';
import { ClienteRepository, DadosAtualizacaoCliente } from '../domain/cliente.repository';
import { ClienteNaoEncontradoException } from '../domain/clientes.exceptions';
import { validarDocumentos } from './criar-cliente.use-case';

@Injectable()
export class AtualizarClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(id: string, dados: DadosAtualizacaoCliente): Promise<Cliente> {
    const clienteExistente = await this.clienteRepository.buscarPorId(id);
    if (!clienteExistente) {
      throw new ClienteNaoEncontradoException(id);
    }

    validarDocumentos(dados.cpf ?? clienteExistente.cpf, dados.cnpj ?? clienteExistente.cnpj);

    return this.clienteRepository.atualizar(id, dados);
  }
}
