/** Tipos de e-mail de pedido que passam pela guarda de idempotência (ver
 * EmailEnviadoRepository) — espelha o enum TipoEmail do schema Prisma. */
export type TipoEmailPedido = 'CONFIRMACAO_PEDIDO' | 'PAGAMENTO_APROVADO' | 'PEDIDO_ENVIADO';

/**
 * O que vai pra fila — de propósito carrega só IDs/dados mínimos, não o Pedido
 * inteiro serializado: quem processa o job (ProcessarEmailUseCase) busca o dado
 * fresco na hora de montar o template, o que importa quando o processamento
 * acontece bem depois do enfileiramento (ex.: depois de um retry).
 *
 * Recuperação de senha e ativação de conta são a exceção: carregam o token direto,
 * porque não há "o token atual do pedido" pra rebuscar — é exatamente aquele valor,
 * gerado uma vez, que precisa chegar no e-mail.
 */
export type TarefaEmail =
  | { tipo: 'CONFIRMACAO_PEDIDO'; pedidoId: string }
  | { tipo: 'PAGAMENTO_APROVADO'; pedidoId: string }
  | { tipo: 'PEDIDO_ENVIADO'; pedidoId: string }
  // Fora da guarda de idempotência (não está em TipoEmailPedido/TipoEmail): um pedido
  // pode ter mais de uma tentativa recusada, e quem enfileira (ProcessarWebhookUseCase)
  // já só faz isso uma vez por pagamento — na transição dele pra RECUSADO.
  | { tipo: 'PAGAMENTO_RECUSADO'; pedidoId: string }
  | { tipo: 'RECUPERACAO_SENHA'; destinatario: string; nomeCliente: string; token: string }
  | { tipo: 'ATIVACAO_CONTA'; destinatario: string; nomeCliente: string; token: string }
  | { tipo: 'CONFIRMACAO_TROCA_EMAIL'; destinatario: string; nomeCliente: string; token: string }
  | { tipo: 'AVISO_EMAIL_ALTERADO'; destinatario: string; nomeCliente: string; novoEmail: string };
