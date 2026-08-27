export type OrigemCotacaoFrete = 'API' | 'TABELA_REGIONAL';

/** Cotação bruta de um provedor — antes de aplicar regras de negócio (frete grátis, retirada). */
export class CotacaoFrete {
  constructor(
    public readonly valor: number,
    public readonly prazoEstimadoDias: number,
    public readonly origem: OrigemCotacaoFrete,
  ) {}
}

export type TipoOpcaoFrete = 'ENTREGA' | 'RETIRADA';

/** Uma opção de entrega apresentada ao cliente no checkout. */
export class OpcaoFrete {
  constructor(
    public readonly tipo: TipoOpcaoFrete,
    public readonly valor: number,
    public readonly prazoEstimadoDias: number,
  ) {}
}
