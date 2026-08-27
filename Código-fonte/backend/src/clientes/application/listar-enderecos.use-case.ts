import { Injectable } from '@nestjs/common';
import { Endereco } from '../domain/endereco.entity';
import { EnderecoRepository } from '../domain/endereco.repository';

@Injectable()
export class ListarEnderecosUseCase {
  constructor(private readonly enderecoRepository: EnderecoRepository) {}

  async executar(clienteId: string): Promise<Endereco[]> {
    return this.enderecoRepository.listarPorCliente(clienteId);
  }
}
