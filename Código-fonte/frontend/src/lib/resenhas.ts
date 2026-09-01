import { api } from '@/lib/http';

export interface Resenha {
  id: string;
  nome: string;
  nota: number;
  comentario: string;
  createdAt: string;
}

export interface CriarResenhaInput {
  nome: string;
  nota: number;
  comentario: string;
}

// GET/POST /resenhas são públicos — avaliação da loja, sem login (mesma lógica de
// checkout de convidado).
export function listarResenhas(): Promise<Resenha[]> {
  return api.get<Resenha[]>('/resenhas');
}

export function criarResenha(input: CriarResenhaInput): Promise<Resenha> {
  return api.post<Resenha>('/resenhas', input);
}
