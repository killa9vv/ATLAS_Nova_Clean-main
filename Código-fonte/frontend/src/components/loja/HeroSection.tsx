import { listarBannersAtivos, type BannerVitrine } from '@/lib/banners';
import { Hero } from './Hero';

// Curto de propósito: quem liga ou troca um banner no painel espera ver na home logo em seguida.
const REVALIDATE_SEGUNDOS = 60;

// Busca os banners do painel no servidor e entrega pro carrossel. Sem nenhum ativo, ou se a
// API falhar, o Hero cai nos slides fixos: a home nunca fica sem o topo.
export async function HeroSection() {
  let banners: BannerVitrine[] = [];
  try {
    banners = await listarBannersAtivos({ next: { revalidate: REVALIDATE_SEGUNDOS } });
  } catch {
    banners = [];
  }
  return <Hero banners={banners} />;
}
