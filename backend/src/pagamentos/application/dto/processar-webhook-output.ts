// Resultado do processamento de um webhook de pagamento.
export interface ProcessarWebhookOutput {
  processado: boolean;
  motivo?: string;
}
