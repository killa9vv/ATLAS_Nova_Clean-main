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

// Checkout de convidado com "salvar meus dados": o backend devolve só o id (é
// upsert por e-mail — devolver o cadastro inteiro expunha dados de qualquer
// cliente pra quem soubesse o e-mail). O id vincula o pedido ao cadastro; se esse
// e-mail já for uma conta com senha, o pedido só entra na conta feito logado.
export function criarCliente(dados: DadosCriacaoCliente): Promise<{ id: string }> {
  return api.post<{ id: string }>('/clientes', dados);
}
