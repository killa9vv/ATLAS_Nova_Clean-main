import { RefreshToken } from './refresh-token.entity';

export interface DadosCriacaoRefreshToken {
  clienteId: string;
  tokenHash: string;
  expiraEm: Date;
}

export abstract class RefreshTokenRepository {
  abstract criar(dados: DadosCriacaoRefreshToken): Promise<RefreshToken>;
  abstract buscarPorHash(tokenHash: string): Promise<RefreshToken | null>;
  abstract revogar(id: string): Promise<void>;
  /** Chamado por TrocarSenhaUseCase — derruba todas as sessões existentes na troca
   * de senha, mesmo padrão de mercado (ex.: "desconectar todos os dispositivos"). */
  abstract revogarTodosDoCliente(clienteId: string): Promise<void>;
}
