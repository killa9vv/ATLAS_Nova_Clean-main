import { MetodoPagamento } from './metodo-pagamento.enum';
import { Pagamento } from './pagamento.entity';
import { StatusPagamento } from './status-pagamento.enum';

export interface NovoPagamento {
  pedidoId: string;
  metodo: MetodoPagamento;
  valor: number;
  status: StatusPagamento;
  gatewayTransactionId: string | null;
  gatewayPayload: unknown;
}

export abstract class PagamentoRepository {
  abstract criar(dados: NovoPagamento): Promise<Pagamento>;
  abstract buscarPorId(id: string): Promise<Pagamento | null>;
  abstract buscarPorGatewayTransactionId(gatewayTransactionId: string): Promise<Pagamento | null>;
  abstract atualizarStatus(
    id: string,
    status: StatusPagamento,
    gatewayPayload: unknown,
  ): Promise<Pagamento>;
}
