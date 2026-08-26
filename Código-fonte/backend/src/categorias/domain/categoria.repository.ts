import { Categoria } from './categoria.entity';

export interface DadosCriacaoCategoria {
  slug: string;
  nome: string;
}

export interface DadosAtualizacaoCategoria {
  nome: string;
}

export abstract class CategoriaRepository {
  abstract listarTodas(): Promise<Categoria[]>;
  abstract buscarPorId(id: string): Promise<Categoria | null>;
  abstract buscarPorSlug(slug: string): Promise<Categoria | null>;
  abstract criar(dados: DadosCriacaoCategoria): Promise<Categoria>;
  abstract atualizar(id: string, dados: DadosAtualizacaoCategoria): Promise<Categoria>;
  abstract excluir(id: string): Promise<void>;

  /** Usado pra impedir exclusão de categoria com produtos vinculados. */
  abstract possuiProdutosVinculados(id: string): Promise<boolean>;
}
