import { adminApi } from '@/lib/admin-api';

export type StatusPedido =
  | 'CRIADO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'AGUARDANDO_CONTATO'
  | 'PAGO'
  | 'SEPARACAO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'ESTORNADO';

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
  numero: string;
  status: StatusPedido;
  itens: ItemPedidoAdmin[];
  total: number;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  valorFrete: number;
  endereco?: EnderecoPedidoAdmin;
  codigoRastreio?: string;
  createdAt: string;
}

export interface PedidosAdminPaginado {
  itens: PedidoAdmin[];
  total: number;
  pagina: number;
  limite: number;
}

export interface FiltrosPedidosAdmin {
  pagina?: number;
  limite?: number;
  status?: StatusPedido;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
}

// Espelha PedidoStateMachine (src/pedidos/domain/pedido-state-machine.ts no backend),
// só as transições que a origem ADMIN pode disparar — só pra montar o dropdown com
// opções que realmente vão funcionar. O backend valida de novo e é a fonte da
// verdade (rejeita com 409 se algo além disso chegar).
export const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
  CRIADO: ['CANCELADO'],
  AGUARDANDO_PAGAMENTO: ['CANCELADO'],
  AGUARDANDO_CONTATO: ['CANCELADO', 'PAGO'],
  PAGO: ['SEPARACAO', 'CANCELADO', 'ESTORNADO'],
  SEPARACAO: ['ENVIADO'],
  ENVIADO: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: [],
  ESTORNADO: [],
};

export const STATUS_LABEL: Record<StatusPedido, string> = {
  CRIADO: 'Criado',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  AGUARDANDO_CONTATO: 'Aguardando contato',
  PAGO: 'Pago',
  SEPARACAO: 'Em separação',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
  ESTORNADO: 'Estornado',
};

export const STATUS_BADGE_CLASSES: Record<StatusPedido, string> = {
  CRIADO: 'bg-sky text-navy',
  AGUARDANDO_PAGAMENTO: 'bg-amber/20 text-amber',
  AGUARDANDO_CONTATO: 'bg-amber/20 text-amber',
  PAGO: 'bg-green/15 text-green',
  SEPARACAO: 'bg-blue/15 text-blue',
  ENVIADO: 'bg-blue/15 text-blue',
  ENTREGUE: 'bg-green/15 text-green',
  CANCELADO: 'bg-red-50 text-red-600',
  ESTORNADO: 'bg-red-50 text-red-600',
};

function paraQueryString(filtros: FiltrosPedidosAdmin): string {
  const params = new URLSearchParams();
  if (filtros.pagina) params.set('pagina', String(filtros.pagina));
  if (filtros.limite) params.set('limite', String(filtros.limite));
  if (filtros.status) params.set('status', filtros.status);
  if (filtros.clienteId) params.set('clienteId', filtros.clienteId);
  if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
  if (filtros.dataFim) params.set('dataFim', filtros.dataFim);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function listarPedidosAdmin(
  filtros: FiltrosPedidosAdmin = {},
): Promise<PedidosAdminPaginado> {
  return adminApi.get<PedidosAdminPaginado>(`/pedidos${paraQueryString(filtros)}`);
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
