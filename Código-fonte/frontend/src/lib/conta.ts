import { api } from '@/lib/http';
import { contaApi } from '@/lib/conta-api';
import type { SessaoCliente } from '@/lib/conta-auth';

// ---------- Autenticação ----------
// Estas chamadas usam o `api` sem auth (não tem sessão ainda) — não passam por contaApi.

export interface RegistrarClienteInput {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export interface ClientePerfil {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
}

export function registrarCliente(dados: RegistrarClienteInput): Promise<ClientePerfil> {
  return api.post<ClientePerfil>('/auth/clientes/registrar', dados);
}

export function loginCliente(email: string, senha: string): Promise<SessaoCliente> {
  return api.post<SessaoCliente>('/auth/clientes/login', { email, senha });
}

// `token` só vem preenchido em modo dev (sem provedor de e-mail configurado no
// backend ainda) — ver TODO em SolicitarRecuperacaoSenhaUseCase.
export function esqueciSenha(email: string): Promise<{ mensagem: string; token?: string }> {
  return api.post('/auth/clientes/esqueci-senha', { email });
}

export function redefinirSenha(token: string, novaSenha: string): Promise<void> {
  return api.post('/auth/clientes/redefinir-senha', { token, novaSenha });
}

// ---------- Dados cadastrais ----------

export function meuPerfil(): Promise<ClientePerfil> {
  return contaApi.get<ClientePerfil>('/clientes/me');
}

export interface AtualizarPerfilInput {
  nome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
}

export function atualizarMeuPerfil(dados: AtualizarPerfilInput): Promise<ClientePerfil> {
  return contaApi.patch<ClientePerfil>('/clientes/me', dados);
}

export function trocarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  return contaApi.patch('/clientes/me/senha', { senhaAtual, novaSenha });
}

// ---------- Endereços ----------

export interface Endereco {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  padrao: boolean;
}

export interface DadosEndereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export function listarMeusEnderecos(): Promise<Endereco[]> {
  return contaApi.get<Endereco[]>('/clientes/me/enderecos');
}

export function criarEndereco(dados: DadosEndereco): Promise<Endereco> {
  return contaApi.post<Endereco>('/clientes/me/enderecos', dados);
}

export function atualizarEndereco(id: string, dados: DadosEndereco): Promise<Endereco> {
  return contaApi.put<Endereco>(`/clientes/me/enderecos/${id}`, dados);
}

export function excluirEndereco(id: string): Promise<void> {
  return contaApi.delete(`/clientes/me/enderecos/${id}`);
}

export function definirEnderecoPadrao(id: string): Promise<Endereco> {
  return contaApi.put<Endereco>(`/clientes/me/enderecos/${id}/padrao`);
}

// ---------- Pedidos ----------

export type StatusPedido =
  'CRIADO' | 'AGUARDANDO_PAGAMENTO' | 'AGUARDANDO_CONTATO' | 'PAGO' | 'CANCELADO' | 'ESTORNADO';

export const STATUS_PEDIDO_LABEL: Record<StatusPedido, string> = {
  CRIADO: 'Aguardando pagamento',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  AGUARDANDO_CONTATO: 'Aguardando contato (WhatsApp)',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  ESTORNADO: 'Estornado',
};

export interface ItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  freteRateado: number;
}

export interface EnderecoEntregaPedido {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Pedido {
  id: string;
  status: StatusPedido;
  itens: ItemPedido[];
  total: number;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  valorFrete: number;
  endereco?: EnderecoEntregaPedido;
  codigoRastreio?: string;
  contato: { nome: string; email?: string; telefone?: string };
  clienteId?: string;
  createdAt: string;
}

export interface MeusPedidosResultado {
  itens: Pedido[];
  total: number;
  pagina: number;
  limite: number;
}

export function listarMeusPedidos(params: {
  pagina?: number;
  limite?: number;
  status?: StatusPedido;
}): Promise<MeusPedidosResultado> {
  const query = new URLSearchParams();
  if (params.pagina) query.set('pagina', String(params.pagina));
  if (params.limite) query.set('limite', String(params.limite));
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  return contaApi.get<MeusPedidosResultado>(`/clientes/me/pedidos${qs ? `?${qs}` : ''}`);
}

export function buscarMeuPedido(id: string): Promise<Pedido> {
  return contaApi.get<Pedido>(`/clientes/me/pedidos/${id}`);
}

export interface EventoRastreio {
  statusAnterior?: StatusPedido;
  statusNovo: StatusPedido;
  alteradoEm: string;
}

export interface Rastreio {
  status: StatusPedido;
  codigoRastreio?: string;
  historico: EventoRastreio[];
}

export function buscarRastreio(id: string): Promise<Rastreio> {
  return contaApi.get<Rastreio>(`/clientes/me/pedidos/${id}/rastreio`);
}

export type MotivoIndisponibilidade = 'PRODUTO_INDISPONIVEL' | 'SEM_ESTOQUE';

export interface ItemRepeticaoDisponivel {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  ajustado: boolean;
}

export interface ItemRepeticaoIndisponivel {
  produtoId: string;
  nome: string;
  motivo: MotivoIndisponibilidade;
}

export interface ResultadoRepeticaoPedido {
  itens: ItemRepeticaoDisponivel[];
  itensIndisponiveis: ItemRepeticaoIndisponivel[];
}

export function repetirPedido(id: string): Promise<ResultadoRepeticaoPedido> {
  return contaApi.post<ResultadoRepeticaoPedido>(`/clientes/me/pedidos/${id}/repetir`);
}
