import { Injectable } from '@nestjs/common';
import { formatoCepValido } from '../../shared/cep.util';
import { DadosAtualizacaoEndereco, EnderecoRepository } from '../domain/endereco.repository';
import { Endereco } from '../domain/endereco.entity';
import {
  CepInvalidoException,
  EnderecoNaoEncontradoException,
} from '../domain/clientes.exceptions';

@Injectable()
export class AtualizarEnderecoUseCase {
  constructor(private readonly enderecoRepository: EnderecoRepository) {}

  async executar(
    id: string,
    clienteId: string,
    dados: DadosAtualizacaoEndereco,
  ): Promise<Endereco> {
    await this.buscarGarantindoPertencimento(id, clienteId);

    if (dados.cep && !formatoCepValido(dados.cep)) {
      throw new CepInvalidoException(dados.cep);
    }

    return this.enderecoRepository.atualizar(id, dados);
  }

  private async buscarGarantindoPertencimento(id: string, clienteId: string): Promise<Endereco> {
    const endereco = await this.enderecoRepository.buscarPorId(id);
    if (!endereco || endereco.clienteId !== clienteId) {
      throw new EnderecoNaoEncontradoException(id);
    }
    return endereco;
  }
}
