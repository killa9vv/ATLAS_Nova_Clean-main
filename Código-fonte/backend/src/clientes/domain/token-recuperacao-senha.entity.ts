export class TokenRecuperacaoSenha {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly tokenHash: string,
    public readonly expiraEm: Date,
    public readonly createdAt: Date,
    public readonly usadoEm?: Date,
  ) {}

  estaValido(): boolean {
    return !this.usadoEm && this.expiraEm.getTime() > Date.now();
  }
}
