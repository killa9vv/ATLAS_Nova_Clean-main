import { adminApi } from '@/lib/admin-api';

export type StatusPedido =
  'CRIADO' | 'AGUARDANDO_PAGAMENTO' | 'AGUARDANDO_CONTATO' | 'PAGO' | 'CANCELADO' | 'ESTORNADO';

export interface ItemPedidoAdmin {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  freteRateado: number;
}

export interface EnderecoPedidoAdmin {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface PedidoAdmin {
  id: string;
  status: StatusPedido;
  itens: ItemPedidoAdmin[];
  total: number;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  valorFrete: number;
  endereco?: EnderecoPedidoAdmin;
  codigoRastreio?: string;
  createdAt: string;
}

// Espelha TRANSICOES_PERMITIDAS de atualizar-status-pedido.use-case.ts no backend —
// só pra montar o dropdown com opções que realmente vão funcionar. O backend
// valida de novo e é a fonte da verdade (rejeita com 409 se algo além disso chegar).
export const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
  CRIADO: ['CANCELADO'],
  AGUARDANDO_PAGAMENTO: ['CANCELADO'],
  AGUARDANDO_CONTATO: ['CANCELADO', 'PAGO'],
  PAGO: ['CANCELADO', 'ESTORNADO'],
  CANCELADO: [],
  ESTORNADO: [],
};

export const STATUS_LABEL: Record<StatusPedido, string> = {
  CRIADO: 'Criado',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  AGUARDANDO_CONTATO: 'Aguardando contato',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  ESTORNADO: 'Estornado',
};

export const STATUS_BADGE_CLASSES: Record<StatusPedido, string> = {
  CRIADO: 'bg-sky text-navy',
  AGUARDANDO_PAGAMENTO: 'bg-amber/20 text-amber',
  AGUARDANDO_CONTATO: 'bg-amber/20 text-amber',
  PAGO: 'bg-green/15 text-green',
  CANCELADO: 'bg-red-50 text-red-600',
  ESTORNADO: 'bg-red-50 text-red-600',
};

export function listarPedidosAdmin(): Promise<PedidoAdmin[]> {
  return adminApi.get<PedidoAdmin[]>('/pedidos');
}

export function atualizarStatusPedidoAdmin(id: string, status: StatusPedido): Promise<PedidoAdmin> {
  return adminApi.patch<PedidoAdmin>(`/pedidos/${id}/status`, { status });
}

export function atualizarRastreioPedidoAdmin(
  id: string,
  codigoRastreio: string,
): Promise<PedidoAdmin> {
  return adminApi.patch<PedidoAdmin>(`/pedidos/${id}/rastreio`, {
    codigoRastreio: codigoRastreio || undefined,
  });
}
