/**
 * Sem CORS_ORIGIN, o Nest libera qualquer origem — ok em dev, mas em produção
 * isso vazaria silenciosamente se alguém esquecesse de configurar a variável
 * no host. Chamado no boot para falhar alto em vez de subir aberto sem ninguém
 * perceber.
 */
export function validarCorsOrigin(
  corsOrigin: string | undefined,
  nodeEnv: string | undefined,
): void {
  if (!corsOrigin && nodeEnv === 'production') {
    throw new Error(
      'CORS_ORIGIN precisa estar definido quando NODE_ENV=production (evita liberar qualquer origem por engano).',
    );
  }
}
