export interface ConexaoRedis {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: Record<string, never>;
  family?: number;
}

/**
 * Redis é opcional: sem REDIS_URL nem REDIS_HOST, os e-mails são enviados na hora
 * em vez de passar pela fila (ver EmailsModule.forRoot) — dá pra rodar sem pagar
 * um serviço Redis. O docker-compose local define REDIS_HOST, então lá a fila
 * continua ligada.
 */
export function redisConfigurado(env: NodeJS.ProcessEnv): boolean {
  return Boolean(env.REDIS_URL || env.REDIS_HOST);
}

/**
 * Monta a conexão do Redis (fila BullMQ) a partir das variáveis de ambiente.
 *
 * REDIS_URL tem prioridade — é o formato que o Railway (e a maioria dos hosts)
 * entrega, com usuário/senha embutidos. Só REDIS_HOST/REDIS_PORT não bastam em
 * produção: o Redis do Railway exige senha, e sem ela a fila nunca conectava e
 * nenhum e-mail saía. REDIS_HOST/REDIS_PORT continuam valendo pro docker-compose
 * local (sem senha), com localhost:6379 como padrão.
 */
export function montarConexaoRedis(env: {
  redisUrl?: string;
  redisHost?: string;
  redisPort?: number;
}): ConexaoRedis {
  if (env.redisUrl) {
    const url = new URL(env.redisUrl);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 6379,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
      // family 0 = aceita IPv4 e IPv6. A rede privada do Railway (*.railway.internal)
      // só resolve em IPv6, e o ioredis tenta só IPv4 por padrão.
      family: 0,
    };
  }

  return {
    host: env.redisHost || 'localhost',
    port: env.redisPort || 6379,
  };
}
