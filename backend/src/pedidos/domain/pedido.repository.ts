// Porta (interface) do repositório de pedidos, implementada em infrastructure com Prisma.
import { NovoItemPedido, Pedido } from './pedido.entity';
import { StatusPedido } from './status-pedido.enum';

export abstract class PedidoRepository {
  abstract criar(itens: NovoItemPedido[], total: number): Promise<Pedido>;
  abstract buscarPorId(id: string): Promise<Pedido | null>;
  abstract atualizarStatus(id: string, status: StatusPedido): Promise<Pedido>;
}
