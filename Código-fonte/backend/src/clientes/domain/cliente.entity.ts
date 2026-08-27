export class Cliente {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email?: string,
    public readonly telefone?: string,
    public readonly cpf?: string,
    public readonly cnpj?: string,
    public readonly createdAt?: Date,
  ) {}
}
