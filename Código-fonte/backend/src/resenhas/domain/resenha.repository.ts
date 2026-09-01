import { Resenha } from './resenha.entity';

export interface DadosCriacaoResenha {
  nome: string;
  nota: number;
  comentario: string;
}

export abstract class ResenhaRepository {
  /** Mais recentes primeiro. */
  abstract listarTodas(): Promise<Resenha[]>;
  abstract criar(dados: DadosCriacaoResenha): Promise<Resenha>;
}
