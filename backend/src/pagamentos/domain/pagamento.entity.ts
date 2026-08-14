// Entidade de domínio Pagamento — registro de uma tentativa/transação de pagamento vinculada a um pedido.
import { MetodoPagamento } from './metodo-pagamento.enum';
import { StatusPagamento } from './status-pagamento.enum';

export class Pagamento {
  constructor(
    public readonly id: string,
    public readonly pedidoId: string,
    public readonly metodo: MetodoPagamento,
    public readonly status: StatusPagamento,
    public readonly valor: number,
    public readonly gatewayTransactionId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
