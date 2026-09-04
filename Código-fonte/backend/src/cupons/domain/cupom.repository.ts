import { Cupom, TipoDesconto } from './cupom.entity';

export interface DadosCriacaoCupom {
  codigo: string;
  tipoDesconto: TipoDesconto;
  valor: number;
  validoAte?: Date;
  usoMaximo?: number;
}

export interface DadosAtualizacaoCupom {
  tipoDesconto?: TipoDesconto;
  valor?: number;
  ativo?: boolean;
  validoAte?: Date | null;
  usoMaximo?: number | null;
}

export abstract class CupomRepository {
  abstract listarTodos(): Promise<Cupom[]>;
  abstract buscarPorId(id: string): Promise<Cupom | null>;
  abstract buscarPorCodigo(codigo: string): Promise<Cupom | null>;
  abstract criar(dados: DadosCriacaoCupom): Promise<Cupom>;
  abstract atualizar(id: string, dados: DadosAtualizacaoCupom): Promise<Cupom>;

  /** Chamado só quando o pedido que usou o cupom é confirmado como PAGO — mesma
   * invariante do estoque (ver ProdutoRepository.decrementarEstoque): aplicar o cupom
   * na criação do pedido não "gasta" o uso de verdade, só a confirmação do pagamento. */
  abstract incrementarUsos(codigo: string, contexto?: unknown): Promise<void>;

  /** Espelha incrementarUsos — chamado quando um pedido PAGO que usou cupom é
   * cancelado/estornado, devolvendo o uso (mesma simetria de incrementarEstoque). */
  abstract decrementarUsos(codigo: string, contexto?: unknown): Promise<void>;
}
