import { Injectable } from '@nestjs/common';
import { Cliente } from '../domain/cliente.entity';
import { ClienteRepository } from '../domain/cliente.repository';

/** Admin-only — ver ClientesController. */
@Injectable()
export class ListarClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(): Promise<Cliente[]> {
    return this.clienteRepository.listarTodos();
  }
}
