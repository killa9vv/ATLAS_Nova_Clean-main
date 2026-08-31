export class Banner {
  constructor(
    public readonly id: string,
    public readonly titulo: string,
    public readonly ordem: number,
    public readonly ativo: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly imagemUrl?: string,
    public readonly linkUrl?: string,
  ) {}
}
