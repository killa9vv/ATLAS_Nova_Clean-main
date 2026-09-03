import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClienteRepository } from '../../domain/cliente.repository';
import { TokenRecuperacaoSenhaRepository } from '../../domain/token-recuperacao-senha.repository';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { TokenRecuperacaoInvalidoException } from '../../domain/clientes.exceptions';
import { hashToken } from '../../../shared/token.util';

const CUSTO_HASH_SENHA = 12;

@Injectable()
export class RedefinirSenhaUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly tokenRepository: TokenRecuperacaoSenhaRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async executar(tokenRecebido: string, novaSenha: string): Promise<void> {
    const token = await this.tokenRepository.buscarPorHash(hashToken(tokenRecebido));
    if (!token || !token.estaValido()) {
      throw new TokenRecuperacaoInvalidoException();
    }

    const senhaHash = await bcrypt.hash(novaSenha, CUSTO_HASH_SENHA);
    await this.clienteRepository.atualizarSenha(token.clienteId, senhaHash);
    await this.tokenRepository.marcarComoUsado(token.id);
    // Redefinir senha derruba todas as sessões existentes — mesma lógica de
    // TrocarSenhaUseCase, e mais importante aqui: se o token vazou porque a conta
    // foi comprometida, sessões antigas não devem continuar válidas.
    await this.refreshTokenRepository.revogarTodosDoCliente(token.clienteId);
  }
}
