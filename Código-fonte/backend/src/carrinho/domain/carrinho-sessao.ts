/** Item persistido no carrinho — deliberadamente sem nome/preço (referência viva ao
 * catálogo, nunca um snapshot). Quem precisa de nome/preço é sempre um use case de
 * leitura (ex: VisualizarCarrinhoUseCase), nunca esta entidade. */
export class ItemCarrinhoSessao {
  constructor(
    public readonly produtoId: string,
    public readonly quantidade: number,
  ) {}
}

/** Carrinho persistido por sessão anônima (sessionToken) e/ou cliente logado
 * (clienteId) — ver Carrinho/ItemCarrinho em prisma/schema.prisma. Não confundir com
 * `Carrinho` de item-precificado.ts, que é a visão calculada/precificada usada no
 * checkout, sem persistência. */
export class CarrinhoSessao {
  constructor(
    public readonly id: string,
    public readonly sessionToken: string,
    public readonly clienteId: string | undefined,
    public readonly itens: ItemCarrinhoSessao[],
    public readonly expiraEm?: Date,
  ) {}
}
