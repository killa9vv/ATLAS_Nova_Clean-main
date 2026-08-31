import { adminApi } from '@/lib/admin-api';

export interface BannerAdmin {
  id: string;
  titulo: string;
  imagemUrl?: string;
  linkUrl?: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DadosBannerForm {
  titulo: string;
  imagemUrl?: string;
  linkUrl?: string;
  ordem?: number;
}

export function listarBannersAdmin(): Promise<BannerAdmin[]> {
  return adminApi.get<BannerAdmin[]>('/banners');
}

export function criarBannerAdmin(dados: DadosBannerForm): Promise<BannerAdmin> {
  return adminApi.post<BannerAdmin>('/banners', dados);
}

export function atualizarBannerAdmin(
  id: string,
  dados: Partial<DadosBannerForm> & { ativo?: boolean },
): Promise<BannerAdmin> {
  return adminApi.put<BannerAdmin>(`/banners/${id}`, dados);
}

export function excluirBannerAdmin(id: string): Promise<void> {
  return adminApi.delete<void>(`/banners/${id}`);
}
