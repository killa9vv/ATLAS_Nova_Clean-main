export class Cliente {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly email?: string,
    public readonly telefone?: string,
    public readonly cpf?: string,
    public readonly cnpj?: string,
    public readonly createdAt?: Date,
    // Nunca exposto em nenhum DTO de resposta — ver ClienteResponseDto, que
    // deliberadamente não mapeia este campo.
    public readonly senhaHash?: string,
  ) {}

  /** false pra um Cliente que só existe do checkout de convidado — nunca "criou
   * conta". LoginClienteUseCase trata isso como credencial inválida, não como um
   * caso especial (não revela que o e-mail existe sem senha). */
  possuiSenha(): boolean {
    return !!this.senhaHash;
  }
}
