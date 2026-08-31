export type TipoDesconto = 'PERCENTUAL' | 'VALOR_FIXO';

export class Cupom {
  constructor(
    public readonly id: string,
    public readonly codigo: string,
    public readonly tipoDesconto: TipoDesconto,
    public readonly valor: number,
    public readonly ativo: boolean,
    public readonly usosCount: number,
    public readonly createdAt: Date,
    public readonly validoAte?: Date,
    public readonly usoMaximo?: number,
  ) {}
}
