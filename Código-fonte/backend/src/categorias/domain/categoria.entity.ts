export class Categoria {
  constructor(
    public readonly id: string,
    public readonly slug: string,
    public readonly nome: string,
    public readonly ativo: boolean = true,
  ) {}
}
