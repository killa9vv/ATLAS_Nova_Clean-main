import { api } from '@/lib/http';

export interface Marca {
  id: string;
  nome: string;
  imagemUrl?: string;
}

// GET /marcas é público (a loja usa pro carrossel de marcas da home).
export function listarMarcas(): Promise<Marca[]> {
  return api.get<Marca[]>('/marcas');
}
