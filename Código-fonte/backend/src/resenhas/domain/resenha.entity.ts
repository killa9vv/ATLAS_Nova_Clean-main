export class Resenha {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly nota: number,
    public readonly comentario: string,
    public readonly createdAt: Date,
  ) {}
}
