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
}
