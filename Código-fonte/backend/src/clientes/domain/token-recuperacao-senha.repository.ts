import { TokenRecuperacaoSenha } from './token-recuperacao-senha.entity';

export interface DadosCriacaoTokenRecuperacao {
  clienteId: string;
  tokenHash: string;
  expiraEm: Date;
}

export abstract class TokenRecuperacaoSenhaRepository {
  abstract criar(dados: DadosCriacaoTokenRecuperacao): Promise<TokenRecuperacaoSenha>;
  abstract buscarPorHash(tokenHash: string): Promise<TokenRecuperacaoSenha | null>;
  abstract marcarComoUsado(id: string): Promise<void>;
  /** Invalida (marca como usado) qualquer token ainda válido do cliente — chamado
   * antes de emitir um novo, pra nunca ter mais de um token válido ao mesmo tempo. */
  abstract invalidarValidosDoCliente(clienteId: string): Promise<void>;
}
