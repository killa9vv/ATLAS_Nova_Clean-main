import { Injectable } from '@nestjs/common';
import { formatoCepValido } from '../../shared/cep.util';
import { ClienteRepository } from '../domain/cliente.repository';
import { Endereco } from '../domain/endereco.entity';
import { EnderecoRepository } from '../domain/endereco.repository';
import { CepInvalidoException, ClienteNaoEncontradoException } from '../domain/clientes.exceptions';

export interface CriarEnderecoInput {
  clienteId: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

@Injectable()
export class CriarEnderecoUseCase {
  constructor(
    private readonly enderecoRepository: EnderecoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async executar(input: CriarEnderecoInput): Promise<Endereco> {
    if (!formatoCepValido(input.cep)) {
      throw new CepInvalidoException(input.cep);
    }

    const cliente = await this.clienteRepository.buscarPorId(input.clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoException(input.clienteId);
    }

    // O primeiro endereço do cliente já nasce padrão — sem isso, o cliente teria
    // que cadastrar um endereço e depois fazer uma segunda chamada só pra marcá-lo
    // como padrão antes de conseguir usá-lo no checkout.
    const enderecosExistentes = await this.enderecoRepository.listarPorCliente(input.clienteId);

    return this.enderecoRepository.criar({
      ...input,
      padrao: enderecosExistentes.length === 0,
    });
  }
}
