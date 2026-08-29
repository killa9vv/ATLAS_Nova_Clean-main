export class Endereco {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly cep: string,
    public readonly logradouro: string,
    public readonly numero: string,
    public readonly bairro: string,
    public readonly cidade: string,
    public readonly estado: string,
    public readonly padrao: boolean,
    public readonly complemento?: string,
  ) {}
}
