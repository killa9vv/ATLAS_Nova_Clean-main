import { Cliente } from './cliente.entity';

export interface DadosCriacaoCliente {
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
}

export interface DadosAtualizacaoCliente {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
}

export abstract class ClienteRepository {
  abstract criar(dados: DadosCriacaoCliente): Promise<Cliente>;
  abstract buscarPorId(id: string): Promise<Cliente | null>;
  abstract buscarPorEmail(email: string): Promise<Cliente | null>;
  abstract atualizar(id: string, dados: DadosAtualizacaoCliente): Promise<Cliente>;
  /** Admin-only — ver ClientesController. */
  abstract listarTodos(): Promise<Cliente[]>;
}
