import { api } from '@/lib/http';

export interface ContatoPedido {
  nome: string;
  email?: string;
  telefone?: string;
}

export interface EnderecoPedido {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface DadosCriacaoPedido {
  itens: { produtoId: string; quantidade: number }[];
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  endereco?: EnderecoPedido;
  contato: ContatoPedido;
  clienteId?: string;
  canal: 'site' | 'whatsapp';
}

export interface PedidoCriado {
  id: string;
  numero: string;
  status: string;
  itens: { produtoId: string; nome: string; quantidade: number; precoUnitario: number }[];
  total: number;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  valorFrete: number;
  endereco?: EnderecoPedido;
}

export function criarPedido(
  dados: DadosCriacaoPedido,
  opcoes?: { headers?: HeadersInit },
): Promise<PedidoCriado> {
  return api.post<PedidoCriado>('/pedidos', dados, opcoes);
}
