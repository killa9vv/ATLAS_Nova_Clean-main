// Item solicitado pelo cliente (produto + quantidade), ainda sem preço — entrada para montar um Carrinho.
export interface CarrinhoItemSolicitado {
  produtoId: string;
  quantidade: number;
}
