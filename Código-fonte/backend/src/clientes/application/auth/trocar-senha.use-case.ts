import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClienteRepository } from '../../domain/cliente.repository';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import {
  ClienteNaoEncontradoException,
  CredenciaisInvalidasException,
} from '../../domain/clientes.exceptions';

const CUSTO_HASH_SENHA = 12;

@Injectable()
export class TrocarSenhaUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async executar(clienteId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const cliente = await this.clienteRepository.buscarPorId(clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoException(clienteId);
    }

    if (
      !cliente.possuiSenha() ||
      !(await bcrypt.compare(senhaAtual, cliente.senhaHash as string))
    ) {
      throw new CredenciaisInvalidasException();
    }

    const senhaHash = await bcrypt.hash(novaSenha, CUSTO_HASH_SENHA);
    await this.clienteRepository.atualizarSenha(clienteId, senhaHash);
    // Derruba as demais sessões (outros dispositivos/abas) — quem está trocando a
    // senha agora precisa logar de novo em qualquer sessão que não seja esta.
    await this.refreshTokenRepository.revogarTodosDoCliente(clienteId);
  }
}
