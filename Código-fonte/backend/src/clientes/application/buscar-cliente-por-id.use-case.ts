import { Injectable } from '@nestjs/common';
import { Cliente } from '../domain/cliente.entity';
import { ClienteRepository } from '../domain/cliente.repository';
import { ClienteNaoEncontradoException } from '../domain/clientes.exceptions';

@Injectable()
export class BuscarClientePorIdUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.buscarPorId(id);
    if (!cliente) {
      throw new ClienteNaoEncontradoException(id);
    }
    return cliente;
  }
}
