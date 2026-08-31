import { api } from '@/lib/http';

export interface OpcaoFrete {
  tipo: 'ENTREGA' | 'RETIRADA';
  valor: number;
  prazoEstimadoDias: number;
}

export interface CotacaoFrete {
  opcoes: OpcaoFrete[];
}

export function cotarFrete(dados: {
  cepDestino: string;
  quantidadeItens: number;
  valorDeclarado: number;
}): Promise<CotacaoFrete> {
  return api.post<CotacaoFrete>('/frete/cotacao', dados);
}
