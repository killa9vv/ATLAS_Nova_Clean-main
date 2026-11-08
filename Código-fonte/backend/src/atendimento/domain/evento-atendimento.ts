export interface ProdutoExibido {
  id: string;
  nome: string;
  marca?: string;
  pack?: string;
  preco: number;
  precoPromocional?: number;
  disponivel: boolean;
  href?: string;
}

/** O que a loja recebe enquanto a resposta é gerada. `whatsapp` leva o texto pronto: quem
 * monta o link é o front, que é onde o número da loja está configurado. */
export type EventoAtendimento =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'produtos'; itens: ProdutoExibido[] }
  | { tipo: 'whatsapp'; mensagem: string }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'fim' };
