import { Marca } from './marca.entity';

export interface DadosAtualizacaoMarca {
  nome: string;
  ativo?: boolean;
}

export abstract class MarcaRepository {
  /** `ativo` omitido retorna ativas e inativas — quem precisa só das ativas (loja) passa `true`. */
  abstract listarTodas(ativo?: boolean): Promise<Marca[]>;
  abstract buscarPorId(id: string): Promise<Marca | null>;
  abstract buscarPorNome(nome: string): Promise<Marca | null>;
  abstract criar(nome: string): Promise<Marca>;
  abstract atualizar(id: string, dados: DadosAtualizacaoMarca): Promise<Marca>;
  abstract excluir(id: string): Promise<void>;

  /** Usado pra impedir exclusão de marca com produtos vinculados. */
  abstract possuiProdutosVinculados(id: string): Promise<boolean>;
}
