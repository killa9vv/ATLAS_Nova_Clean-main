import { Marca } from './marca.entity';

export abstract class MarcaRepository {
  abstract listarTodas(): Promise<Marca[]>;
  abstract buscarPorId(id: string): Promise<Marca | null>;
  abstract buscarPorNome(nome: string): Promise<Marca | null>;
  abstract criar(nome: string): Promise<Marca>;
  abstract atualizar(id: string, nome: string): Promise<Marca>;
  abstract excluir(id: string): Promise<void>;

  /** Usado pra impedir exclusão de marca com produtos vinculados. */
  abstract possuiProdutosVinculados(id: string): Promise<boolean>;
}
