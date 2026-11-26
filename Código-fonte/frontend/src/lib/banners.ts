import { api } from '@/lib/http';

/** Banner cadastrado no painel admin, como a vitrine recebe (só os ativos, já na ordem). */
export interface BannerVitrine {
  id: string;
  titulo: string;
  imagemUrl?: string;
  linkUrl?: string;
}

export function listarBannersAtivos(opcoes?: {
  next?: { revalidate?: number };
}): Promise<BannerVitrine[]> {
  return api.get<BannerVitrine[]>('/banners/ativos', opcoes);
}
