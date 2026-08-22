import { ImagemProduto } from './imagem-produto.entity';

export interface DadosCriacaoImagemProduto {
  produtoId: string;
  url: string;
  providerId: string;
  ordem: number;
}

export abstract class ImagemProdutoRepository {
  abstract listarPorProduto(produtoId: string): Promise<ImagemProduto[]>;
  abstract buscarPorId(id: string): Promise<ImagemProduto | null>;
  abstract contarPorProduto(produtoId: string): Promise<number>;
  abstract criar(dados: DadosCriacaoImagemProduto): Promise<ImagemProduto>;
  abstract excluir(id: string): Promise<void>;

  /** Troca a `ordem` da imagem com a que hoje está em ordem 0 (a principal atual). */
  abstract definirComoPrincipal(imagem: ImagemProduto): Promise<void>;
}
