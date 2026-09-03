export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly tokenHash: string,
    public readonly expiraEm: Date,
    public readonly createdAt: Date,
    public readonly revogadoEm?: Date,
  ) {}

  estaValido(): boolean {
    return !this.revogadoEm && this.expiraEm.getTime() > Date.now();
  }
}
