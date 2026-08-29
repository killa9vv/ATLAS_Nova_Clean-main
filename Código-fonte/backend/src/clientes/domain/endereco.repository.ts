import { Endereco } from './endereco.entity';

export interface DadosCriacaoEndereco {
  clienteId: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  /** Primeiro endereço do cliente vira padrão automaticamente mesmo sem pedir (ver CriarEnderecoUseCase). */
  padrao?: boolean;
}

export interface DadosAtualizacaoEndereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export abstract class EnderecoRepository {
  abstract criar(dados: DadosCriacaoEndereco): Promise<Endereco>;
  abstract listarPorCliente(clienteId: string): Promise<Endereco[]>;
  abstract buscarPorId(id: string): Promise<Endereco | null>;
  abstract atualizar(id: string, dados: DadosAtualizacaoEndereco): Promise<Endereco>;
  abstract excluir(id: string): Promise<void>;

  /**
   * Marca este endereço como padrão do cliente e desmarca qualquer outro que já
   * fosse — as duas escritas acontecem na mesma transação interna do método. O
   * índice único parcial em `enderecos` (ver migration) é a garantia de banco contra
   * duas requisições concorrentes tentando marcar padrões diferentes ao mesmo tempo.
   */
  abstract definirComoPadrao(id: string, clienteId: string): Promise<Endereco>;
}
