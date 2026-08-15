// Catálogo da loja: tipos de produto (com suas variantes por marca), além
// das listas derivadas (PRODUCTS, BRANDS, etc.) usadas pelo resto do app.
// Porte tipado de atlas-nova-clean-loja/js/data/products.js — este arquivo é
// só dados, a lógica de exibição fica com os componentes que o consomem.

export type Category = 'limpeza' | 'descartaveis' | 'papelaria';

export interface ProductVariant {
  id: string;
  brand: string;
  pack: string;
  price: number;
  info?: string;
  precautions?: string;
}

export interface ProductType {
  id: string;
  cat: Category;
  name: string;
  variants: ProductVariant[];
}

// Lista plana (1 linha por variante/marca) — usada pelo carrinho, busca e filtros de marca.
export interface ProductListItem {
  id: string;
  cat: Category;
  brand: string;
  name: string;
  pack: string;
  price: number;
  typeId: string;
}

export interface BrandSummary {
  brand: string;
  count: number;
}

export const STORE_WHATSAPP = '5522997805258'; // TODO: trocar pelo número real da loja

// Cada "tipo" é um produto genérico (ex: Detergente para Louça).
// Quando o mesmo tipo existe em mais de uma marca, todas entram em `variants`
// e o card do site abre um leque pra escolher a marca. Com só 1 variante,
// o card funciona direto, sem leque.
export const PRODUCT_TYPES: ProductType[] = [
  // ---------- Limpeza (catálogo real) ----------
  {
    id: 't-detergente-louca',
    cat: 'limpeza',
    name: 'Detergente para Louça',
    variants: [
      { id: 'l1', brand: 'Ypê', pack: 'Neutro · 500ml', price: 2.85 },
      { id: 'l2', brand: 'Ypê', pack: 'Limão · 500ml', price: 2.85 },
      { id: 'l3', brand: 'Ypê', pack: 'Coco · 500ml', price: 2.85 },
      { id: 'l4', brand: 'Ypê', pack: 'Capim-Limão · 500ml', price: 2.85 },
      { id: 'l5', brand: 'Ypê', pack: 'Maçã · 500ml', price: 2.85 },
      { id: 'l6', brand: 'Ypê', pack: 'Enz. Ativo · 500ml', price: 3.47 },
      { id: 'l7', brand: 'Ypê', pack: 'Enz. Ativo P · 500ml', price: 3.47 },
      { id: 'l8', brand: 'Azulim', pack: 'Maçã · 500ml', price: 3.59 },
      { id: 'l9', brand: 'Azulim', pack: 'Clear · 500ml', price: 3.59 },
      { id: 'l10', brand: 'Limpadua', pack: 'Neutro · 500ml', price: 2.2 },
      { id: 'l11', brand: 'Alpes', pack: 'Clear c/bicarbonato · 1L', price: 5.8 },
    ],
  },
  {
    id: 't-agua-sanitaria',
    cat: 'limpeza',
    name: 'Água Sanitária',
    variants: [
      { id: 'l12', brand: 'Tuff', pack: '5L', price: 22.15 },
      { id: 'l13', brand: 'Tuff', pack: '1L', price: 5.75 },
      { id: 'l14', brand: 'Ypê', pack: '1L', price: 5.7 },
      { id: 'l15', brand: 'Ypê', pack: '5L', price: 20.29 },
      { id: 'l16', brand: 'Limpadua', pack: '1L', price: 2.8 },
      { id: 'l17', brand: 'Limpadua', pack: '2L', price: 4.95 },
      { id: 'l18', brand: 'Limpadua', pack: '5L', price: 12.85 },
      { id: 'l19', brand: 'Cloral', pack: '1L', price: 3.25 },
      { id: 'l20', brand: 'Cloral', pack: '2L', price: 4.8 },
      { id: 'l21', brand: 'Cloral', pack: '5L', price: 11.7 },
    ],
  },
  {
    id: 't-sabao-po',
    cat: 'limpeza',
    name: 'Sabão em Pó / Lava-Roupas em Pó',
    variants: [
      { id: 'l22', brand: 'Urca', pack: 'Concentrado', price: 6.9 },
      { id: 'l23', brand: 'Ultralar', pack: '500g', price: 3.15 },
      { id: 'l24', brand: 'Tixan', pack: 'Primavera · 400g', price: 6.99 },
      { id: 'l25', brand: 'Facilita', pack: 'Tradicional · 800g', price: 7.5 },
      { id: 'l26', brand: 'Invicto', pack: 'Lavanda · 400g', price: 3.75 },
    ],
  },
  {
    id: 't-sabao-barra',
    cat: 'limpeza',
    name: 'Sabão em Barra / Coco',
    variants: [
      { id: 'l27', brand: 'Ypê', pack: 'Toque de Aveia · 160g', price: 4.99 },
      { id: 'l28', brand: 'Ypê', pack: 'Multi Ativo · 160g', price: 3.59 },
      { id: 'l29', brand: 'Ypê', pack: 'Neutro · 160g', price: 4.99 },
      { id: 'l30', brand: 'Urca', pack: '5x90g', price: 8.7 },
      { id: 'l31', brand: 'Ruth Care', pack: '180g', price: 5.9 },
      { id: 'l32', brand: 'Azulim', pack: 'Glicerinado · 750g', price: 12.35 },
      { id: 'l33', brand: 'Alpes', pack: 'Super Glicerinado · 5x160g', price: 14.99 },
      { id: 'l34', brand: 'Alpes', pack: 'Blue Glicerinado · 5x160g', price: 17.99 },
    ],
  },
  {
    id: 't-amaciante',
    cat: 'limpeza',
    name: 'Amaciante de Roupas',
    variants: [
      { id: 'l35', brand: 'Downy', pack: 'Concentrado · 500ml', price: 13.4 },
      { id: 'l36', brand: 'Tuff', pack: 'Concentrado Summer · 1,5L', price: 22.64 },
      { id: 'l37', brand: 'Tuff', pack: 'Concentrado Spring · 1,5L', price: 22.4 },
      { id: 'l38', brand: 'Tuff', pack: 'Concentrado Winter · 1,5L', price: 22.64 },
      { id: 'l39', brand: 'Ypê', pack: 'Aconchego · 500ml', price: 3.48 },
      { id: 'l40', brand: 'Facilita', pack: 'Coco · 5L', price: 23.27 },
      { id: 'l41', brand: 'Facilita', pack: 'Clássico · 5L', price: 23.27 },
      { id: 'l42', brand: 'Limpadua', pack: 'Azul · 2L', price: 7.24 },
      { id: 'l43', brand: 'Urca', pack: 'Brisa Concentrado · 500ml', price: 6.79 },
      { id: 'l44', brand: 'Urca', pack: 'Brisa Azul · 2L', price: 8.29 },
      { id: 'l45', brand: 'Urca', pack: 'Brisa Azul · 5L', price: 17.93 },
    ],
  },
  {
    id: 't-lava-roupas-liquido',
    cat: 'limpeza',
    name: 'Lava-Roupas Líquido',
    variants: [
      { id: 'l46', brand: 'Urca', pack: 'Azul · 3L', price: 20.75 },
      { id: 'l47', brand: 'UAU', pack: 'Active · 3L', price: 26.76 },
      { id: 'l48', brand: 'UAU', pack: 'Coco · 1,7L', price: 15.85 },
      { id: 'l49', brand: 'UAU', pack: 'Rosas e Sedução · 3L', price: 26.76 },
      { id: 'l50', brand: 'Tuff', pack: 'Concentrado · 1L', price: 14.22 },
      { id: 'l51', brand: 'Facilita', pack: 'Lavanda · 3L', price: 24.77 },
      { id: 'l52', brand: 'OMO', pack: 'Lavagem Perfeita · 3L (rende 30 lavagens)', price: 39.99 },
      { id: 'l53', brand: 'OMO', pack: 'Lavagem Perfeita · refil sachê', price: 15.7 },
      { id: 'l54', brand: 'Limpadua', pack: 'Azul · 1L', price: 7.67 },
    ],
  },
  {
    id: 't-multiuso',
    cat: 'limpeza',
    name: 'Limpador Multiuso',
    variants: [
      { id: 'l55', brand: 'UAU', pack: 'Rosas e Sedução · 500ml', price: 5.99 },
      { id: 'l56', brand: 'UAU', pack: 'Flores e Folhas · 500ml', price: 5.99 },
      { id: 'l57', brand: 'UAU', pack: 'Chá Branco · 500ml', price: 5.99 },
      { id: 'l58', brand: 'UAU', pack: 'Odores · 500ml', price: 6.29 },
      { id: 'l59', brand: 'Facilita', pack: 'Floral · 500ml', price: 3.9 },
      { id: 'l60', brand: 'Facilita', pack: 'Citrus · 500ml', price: 3.9 },
      { id: 'l61', brand: 'Limpadua', pack: 'Tradicional · 500ml', price: 3.8 },
      { id: 'l62', brand: 'Azulim', pack: 'Original · 500ml', price: 4.25 },
      { id: 'l63', brand: 'Azulim', pack: 'Bactericida · 500ml', price: 4.15 },
      { id: 'l64', brand: 'Veja', pack: 'Campestre · 500ml', price: 4.49 },
      { id: 'l65', brand: 'Veja', pack: 'Original · 500ml', price: 4.99 },
      { id: 'l66', brand: 'Veja', pack: 'Floral · 500ml', price: 4.65 },
      { id: 'l67', brand: 'Veja', pack: 'Power Fusão Coco · 500ml', price: 9.89 },
      { id: 'l68', brand: 'Alpes', pack: 'Tradicional · 500ml', price: 3.79 },
      { id: 'l69', brand: 'Urca', pack: 'Álcool · 500ml', price: 4.15 },
    ],
  },
  {
    id: 't-limpa-vidros',
    cat: 'limpeza',
    name: 'Limpa-Vidros',
    variants: [
      { id: 'l70', brand: 'Limpol', pack: '4 em 1 · 500ml', price: 8.15 },
      { id: 'l71', brand: 'UAU', pack: 'Blindex · 500ml', price: 10.99 },
      { id: 'l72', brand: 'Azulim', pack: 'c/Álcool Spray · 500ml', price: 11.7 },
      { id: 'l73', brand: 'Urca', pack: 'Squeeze · 500ml', price: 5.87 },
      { id: 'l74', brand: 'Limpadua', pack: 'Tradicional · 500ml', price: 4.46 },
      { id: 'l75', brand: 'Veja', pack: 'Cristal · 500ml', price: 27.99 },
      { id: 'l76', brand: 'Facilita', pack: '500ml', price: 4.76 },
    ],
  },
  {
    id: 't-desengordurante',
    cat: 'limpeza',
    name: 'Desengordurante',
    variants: [{ id: 'l77', brand: 'Limpol', pack: 'Limão · 500ml', price: 8.45 }],
  },
  {
    id: 't-pasta-cozinha',
    cat: 'limpeza',
    name: 'Pasta de Limpeza / Alumínio',
    variants: [
      { id: 'l78', brand: 'Vitral', pack: 'Sabão Pasta · 200g', price: 5.55 },
      { id: 'l79', brand: 'Alumil', pack: 'Pasta de Brilho · 480g', price: 5.2 },
      { id: 'l80', brand: 'Alumil', pack: 'Limpa Alumínio Plus · 500ml', price: 4.85 },
    ],
  },
  {
    id: 't-percarbonato',
    cat: 'limpeza',
    name: 'Percarbonato de Sódio',
    variants: [{ id: 'l81', brand: 'Tuff', pack: '1kg', price: 34.99 }],
  },
  {
    id: 't-alvejante-sem-cloro',
    cat: 'limpeza',
    name: 'Alvejante sem Cloro',
    variants: [{ id: 'l82', brand: 'Tuff', pack: '1L', price: 8.43 }],
  },
  {
    id: 't-passa-facil',
    cat: 'limpeza',
    name: 'Spray Passa Fácil',
    variants: [{ id: 'l83', brand: 'Tuff', pack: 'Sem Passar · 350ml', price: 14.9 }],
  },

  // ---------- Descartáveis ----------
  {
    id: 't-saco-lixo-10',
    cat: 'descartaveis',
    name: 'Saco de Lixo 10L',
    variants: [
      { id: 'd19', brand: 'Prático', pack: 'Lilás · rolinho pia e banheiro', price: 10.5 },
      { id: 'd20', brand: 'Prático', pack: 'Leitoso · rolinho pia e banheiro', price: 10.99 },
    ],
  },
  {
    id: 't-saco-lixo-15',
    cat: 'descartaveis',
    name: 'Saco de Lixo 15L',
    variants: [{ id: 'd21', brand: 'Prático', pack: 'ECO · rolinho', price: 9.45 }],
  },
  {
    id: 't-saco-lixo-30',
    cat: 'descartaveis',
    name: 'Saco de Lixo 30L',
    variants: [{ id: 'd22', brand: 'Prático', pack: 'ECO · rolinho', price: 9.75 }],
  },
  {
    id: 't-saco-lixo-50',
    cat: 'descartaveis',
    name: 'Saco de Lixo 50L',
    variants: [{ id: 'd23', brand: 'Prático', pack: 'ECO · rolinho', price: 9.75 }],
  },
  {
    id: 't-saco-lixo-60',
    cat: 'descartaveis',
    name: 'Saco de Lixo 60L',
    variants: [
      { id: 'd24', brand: 'Fort', pack: 'Roll Reforçado', price: 29.1 },
      { id: 'd25', brand: 'Urso', pack: 'Extra · 75x85 · 15kg', price: 40.79 },
    ],
  },
  {
    id: 't-saco-lixo-100',
    cat: 'descartaveis',
    name: 'Saco de Lixo 100L',
    variants: [
      { id: 'd26', brand: 'Prático', pack: 'ECO · rolinho', price: 11.7 },
      { id: 'd27', brand: 'Fort', pack: 'Roll Reforçado', price: 33.3 },
      { id: 'd28', brand: 'Urso', pack: 'Extra · 90x1,05 · 25kg', price: 54.5 },
    ],
  },
  {
    id: 't-saco-lixo-200',
    cat: 'descartaveis',
    name: 'Saco de Lixo 200L',
    variants: [{ id: 'd29', brand: 'Urso', pack: 'Extra · 95x1,20 · 35kg', price: 68.0 }],
  },
  {
    id: 't-copo-200',
    cat: 'descartaveis',
    name: 'Copo Descartável 200ml',
    variants: [
      { id: 'd1', brand: 'Nova Clean', pack: 'pacote 100un', price: 6.9 },
      { id: 'd10', brand: 'Copobras', pack: 'pacote 100un', price: 7.5 },
    ],
  },
  {
    id: 't-guardanapo',
    cat: 'descartaveis',
    name: 'Guardanapo de Papel',
    variants: [
      { id: 'd2', brand: 'Nova Clean', pack: 'pacote 50un', price: 4.5 },
      { id: 'd11', brand: 'Santher', pack: 'pacote 50un', price: 3.9 },
    ],
  },
  {
    id: 't-papel-toalha',
    cat: 'descartaveis',
    name: 'Papel Toalha Interfolha',
    variants: [
      { id: 'd3', brand: 'Nova Clean', pack: 'pacote 1000un', price: 22.9 },
      { id: 'd12', brand: 'Snob', pack: 'pacote 1000un', price: 24.9 },
    ],
  },
  {
    id: 't-prato',
    cat: 'descartaveis',
    name: 'Prato Descartável Raso',
    variants: [
      { id: 'd4', brand: 'Nova Clean', pack: 'pacote 10un', price: 5.9 },
      { id: 'd13', brand: 'Copobras', pack: 'pacote 10un', price: 6.5 },
    ],
  },
  {
    id: 't-kit-talher',
    cat: 'descartaveis',
    name: 'Kit Talher Descartável',
    variants: [
      { id: 'd6', brand: 'Nova Clean', pack: '25un', price: 8.9 },
      { id: 'd15', brand: 'Copobras', pack: '25un', price: 9.5 },
    ],
  },
  {
    id: 't-papel-higienico',
    cat: 'descartaveis',
    name: 'Papel Higiênico Folha Dupla',
    variants: [
      { id: 'd7', brand: 'Nova Clean', pack: 'pacote 12 rolos', price: 24.9 },
      { id: 'd16', brand: 'Neve', pack: 'pacote 12 rolos', price: 27.9 },
    ],
  },
  {
    id: 't-filme-pvc',
    cat: 'descartaveis',
    name: 'Filme PVC',
    variants: [
      { id: 'd8', brand: 'Nova Clean', pack: '30cm x 100m', price: 11.5 },
      { id: 'd17', brand: 'Rolopac', pack: '30cm x 100m', price: 12.9 },
    ],
  },
  {
    id: 't-copo-50',
    cat: 'descartaveis',
    name: 'Copo Descartável 50ml (cafezinho)',
    variants: [
      { id: 'd9', brand: 'Nova Clean', pack: 'pacote 100un', price: 4.9 },
      { id: 'd18', brand: 'Copobras', pack: 'pacote 100un', price: 5.5 },
    ],
  },

  // ---------- Papelaria (placeholder, sem dados reais ainda) ----------
  {
    id: 't-caderno',
    cat: 'papelaria',
    name: 'Caderno Universitário 10 Matérias',
    variants: [
      { id: 'p1', brand: 'Nova Clean', pack: '200 folhas', price: 27.9 },
      { id: 'p9', brand: 'Tilibra', pack: '200 folhas', price: 32.9 },
    ],
  },
  {
    id: 't-caneta',
    cat: 'papelaria',
    name: 'Caneta Esferográfica Azul',
    variants: [
      { id: 'p2', brand: 'Nova Clean', pack: 'caixa 50un', price: 15.0 },
      { id: 'p10', brand: 'BIC', pack: 'caixa 50un', price: 22.9 },
    ],
  },
  {
    id: 't-papel-sulfite',
    cat: 'papelaria',
    name: 'Papel Sulfite A4',
    variants: [
      { id: 'p3', brand: 'Nova Clean', pack: 'pacote 500 folhas', price: 24.9 },
      { id: 'p11', brand: 'Chamex', pack: 'pacote 500 folhas', price: 26.9 },
    ],
  },
  {
    id: 't-envelope',
    cat: 'papelaria',
    name: 'Envelope Ofício',
    variants: [
      { id: 'p4', brand: 'Nova Clean', pack: 'pacote 50un', price: 9.9 },
      { id: 'p12', brand: 'Scrity', pack: 'pacote 50un', price: 11.9 },
    ],
  },
  {
    id: 't-fita-adesiva',
    cat: 'papelaria',
    name: 'Fita Adesiva Transparente',
    variants: [
      { id: 'p5', brand: 'Nova Clean', pack: '45mm x 50m', price: 6.5 },
      { id: 'p13', brand: 'Scotch', pack: '45mm x 50m', price: 8.9 },
    ],
  },
  {
    id: 't-cola-bastao',
    cat: 'papelaria',
    name: 'Cola Bastão',
    variants: [
      { id: 'p6', brand: 'Nova Clean', pack: '20g', price: 3.2 },
      { id: 'p14', brand: 'Pritt', pack: '20g', price: 4.5 },
    ],
  },
  {
    id: 't-lapis',
    cat: 'papelaria',
    name: 'Lápis Preto nº2',
    variants: [
      { id: 'p7', brand: 'Nova Clean', pack: 'caixa 12un', price: 7.9 },
      { id: 'p15', brand: 'Faber-Castell', pack: 'caixa 12un', price: 9.9 },
    ],
  },
  {
    id: 't-pasta',
    cat: 'papelaria',
    name: 'Pasta Catálogo com Elástico',
    variants: [
      { id: 'p8', brand: 'Nova Clean', pack: 'unidade', price: 12.9 },
      { id: 'p16', brand: 'Dac', pack: 'unidade', price: 14.9 },
    ],
  },
];

export const PRODUCTS: ProductListItem[] = PRODUCT_TYPES.flatMap((t) =>
  t.variants.map((v) => ({
    id: v.id,
    cat: t.cat,
    brand: v.brand,
    name: t.name,
    pack: v.pack,
    price: v.price,
    typeId: t.id,
  })),
);

export const CATEGORY_COLORS: Record<Category, [string, string, string]> = {
  limpeza: ['#EAF4FF', '#DCEBFF', '#E3F0FF'],
  descartaveis: ['#FFF3E0', '#FFEAD1', '#FFF0DE'],
  papelaria: ['#EAF7EF', '#E1F3E8', '#E7F5EC'],
};

export const CATEGORIES: Category[] = ['limpeza', 'descartaveis', 'papelaria'];

// Marcas únicas + quantidade de produtos, usado no carrossel de marcas da home.
export const BRANDS: BrandSummary[] = Object.entries(
  PRODUCTS.reduce<Record<string, number>>((acc, p) => {
    acc[p.brand] = (acc[p.brand] ?? 0) + 1;
    return acc;
  }, {}),
)
  .map(([brand, count]) => ({ brand, count }))
  .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));

// Texto padrão de info técnica/precauções por categoria, usado na tela de detalhe
// quando uma variante não tem texto próprio (`info`/`precautions`). São textos
// genéricos — troque pelos dados reais da ficha técnica de cada produto quando tiver.
export const CATEGORY_INFO: Record<Category, { info: string; precautions: string }> = {
  limpeza: {
    info: 'Produto de limpeza para uso doméstico e comercial. Dilua conforme as instruções da embalagem antes do uso, salvo indicação contrária do fabricante.',
    precautions:
      'Mantenha fora do alcance de crianças e animais. Não ingira. Evite contato com olhos e pele — em caso de contato, lave com água em abundância. Não misture com outros produtos de limpeza, principalmente à base de cloro ou amônia. Use em ambiente ventilado.',
  },
  descartaveis: {
    info: 'Produto descartável de uso único. Confira a quantidade e o tamanho da embalagem antes da compra.',
    precautions:
      'Mantenha fora do alcance de crianças. Descarte de forma consciente, respeitando a coleta seletiva quando possível.',
  },
  papelaria: {
    info: 'Produto de papelaria para uso escolar ou de escritório. Consulte a embalagem para especificações de gramatura, tamanho ou cor.',
    precautions: 'Mantenha em local seco. Supervisione o uso por crianças pequenas.',
  },
};
