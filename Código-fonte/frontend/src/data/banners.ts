// Conteúdo do carrossel principal da home. Fixo em config local, não vem de admin/CMS
// — não existe painel pra gerenciar banners ainda (fora de escopo deste card). Cada
// slide reaproveita só afirmações já verdadeiras hoje (nada inventado: atacado/varejo,
// WhatsApp e Pix/cartão já são reais em outras partes do site). Editar aqui é a forma
// de trocar o conteúdo até existir um painel de verdade.
export interface BannerSlide {
  id: string;
  eyebrow: string;
  titulo: string;
  destaque: string;
  texto: string;
  ctaTexto: string;
  ctaHref: string;
  corBlob1: string;
  corBlob2: string;
}

export const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'boas-vindas',
    eyebrow: 'Campos dos Goytacazes, RJ',
    titulo: 'Limpeza, descartáveis e papelaria',
    destaque: 'sem sair de casa',
    texto:
      'Atacado e varejo das marcas que você já confia. Monte sua lista e feche pelo WhatsApp ou pague direto no site.',
    ctaTexto: 'Ver catálogo completo',
    ctaHref: '/catalogo',
    corBlob1: '#2e9bf5',
    corBlob2: '#1faa59',
  },
  {
    id: 'atacado-varejo',
    eyebrow: 'Pra sua casa ou pro seu comércio',
    titulo: 'Compra em quantidade',
    destaque: 'com preço justo',
    texto:
      'Atacado pro seu comércio ou só o que precisa pra casa, sem pedido mínimo e com desconto automático por quantidade.',
    ctaTexto: 'Ver catálogo completo',
    ctaHref: '/catalogo',
    corBlob1: '#ffb020',
    corBlob2: '#2e9bf5',
  },
  {
    id: 'whatsapp',
    eyebrow: 'Do jeito que for mais fácil pra você',
    titulo: 'Peça pelo WhatsApp',
    destaque: 'ou direto no site',
    texto:
      'Manda sua lista no WhatsApp e a gente confirma tudo por lá, ou finalize o pedido com Pix ou cartão aqui mesmo.',
    ctaTexto: 'Chamar no WhatsApp',
    ctaHref: 'whatsapp',
    corBlob1: '#1faa59',
    corBlob2: '#ffb020',
  },
];
