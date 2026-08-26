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

  /**
   * Atualiza o status apenas se o status atual no banco ainda for `statusEsperado`
   * (UPDATE condicional, sem lock explícito). Devolve `null` quando isso não é mais
   * verdade — ou seja, outra notificação de webhook concorrente já escreveu um status
   * diferente entre a leitura que originou esta chamada e esta escrita. Existe pra
   * fechar a janela de corrida da checagem de idempotência (que só compara valores
   * lidos em momentos diferentes, sem isso): duas notificações concorrentes não podem
   * mais aplicar os efeitos colaterais (reconciliação do pedido, devolução de estoque)
   * duas vezes.
   */
  abstract atualizarStatus(
    id: string,
    statusEsperado: StatusPagamento,
    novoStatus: StatusPagamento,
    gatewayPayload: unknown,
  ): Promise<Pagamento | null>;

  /**
   * Pagamentos ainda não finalizados (PENDENTE/EM_PROCESSAMENTO) criados antes de
   * `limite` — candidatos a webhook perdido, usados pelo job de reconciliação.
   */
  abstract listarPendentesCriadosAntesDe(limite: Date): Promise<Pagamento[]>;
}
