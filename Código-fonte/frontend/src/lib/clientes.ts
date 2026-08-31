import { api } from '@/lib/http';

export interface EnderecoPorCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export function buscarEnderecoPorCep(cep: string): Promise<EnderecoPorCep> {
  return api.get<EnderecoPorCep>(`/clientes/cep/${cep}`);
}

export interface DadosCriacaoCliente {
  nome: string;
  email?: string;
  telefone?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

// Checkout de convidado, sem login: o `id` devolvido é o "segredo" que o front guarda
// (localStorage) — mesmo padrão já usado no resto do backend (ver comentário em
// ClientesController.criar). Reaproveitado no checkout como forma leve de "salvar
// meus dados" pra próxima compra, sem inventar sessão/autenticação de verdade.
export function criarCliente(dados: DadosCriacaoCliente): Promise<Cliente> {
  return api.post<Cliente>('/clientes', dados);
}
