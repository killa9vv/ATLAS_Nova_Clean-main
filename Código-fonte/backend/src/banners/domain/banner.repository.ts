import { Banner } from './banner.entity';

export interface DadosCriacaoBanner {
  titulo: string;
  imagemUrl?: string;
  linkUrl?: string;
  ordem?: number;
}

export interface DadosAtualizacaoBanner {
  titulo?: string;
  imagemUrl?: string;
  linkUrl?: string;
  ordem?: number;
  ativo?: boolean;
}

export abstract class BannerRepository {
  /** Mais recentes primeiro por ordem de exibição, depois criação. */
  abstract listarTodos(): Promise<Banner[]>;
  abstract buscarPorId(id: string): Promise<Banner | null>;
  abstract criar(dados: DadosCriacaoBanner): Promise<Banner>;
  abstract atualizar(id: string, dados: DadosAtualizacaoBanner): Promise<Banner>;
  abstract excluir(id: string): Promise<void>;
}
