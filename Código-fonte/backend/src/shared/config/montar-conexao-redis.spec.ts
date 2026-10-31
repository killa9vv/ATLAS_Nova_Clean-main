import { montarConexaoRedis, redisConfigurado } from './montar-conexao-redis';

describe('redisConfigurado', () => {
  it('é falso sem REDIS_URL nem REDIS_HOST', () => {
    expect(redisConfigurado({})).toBe(false);
    expect(redisConfigurado({ REDIS_URL: '', REDIS_HOST: '' })).toBe(false);
  });

  it('é verdadeiro com REDIS_URL ou REDIS_HOST', () => {
    expect(redisConfigurado({ REDIS_URL: 'redis://host:6379' })).toBe(true);
    expect(redisConfigurado({ REDIS_HOST: 'redis' })).toBe(true);
  });
});

describe('montarConexaoRedis', () => {
  it('usa localhost:6379 quando nada está definido', () => {
    expect(montarConexaoRedis({})).toEqual({ host: 'localhost', port: 6379 });
  });

  it('usa REDIS_HOST/REDIS_PORT quando não há REDIS_URL', () => {
    expect(montarConexaoRedis({ redisHost: 'redis', redisPort: 6380 })).toEqual({
      host: 'redis',
      port: 6380,
    });
  });

  it('extrai host, porta, usuário e senha da REDIS_URL', () => {
    expect(
      montarConexaoRedis({ redisUrl: 'redis://default:s3nh%40@redis.railway.internal:6379' }),
    ).toEqual({
      host: 'redis.railway.internal',
      port: 6379,
      username: 'default',
      password: 's3nh@',
      tls: undefined,
      family: 0,
    });
  });

  it('REDIS_URL tem prioridade sobre REDIS_HOST/REDIS_PORT', () => {
    const conexao = montarConexaoRedis({
      redisUrl: 'redis://:senha@host-da-url:1234',
      redisHost: 'outro-host',
      redisPort: 6379,
    });
    expect(conexao.host).toBe('host-da-url');
    expect(conexao.port).toBe(1234);
    expect(conexao.password).toBe('senha');
    expect(conexao.username).toBeUndefined();
  });

  it('liga TLS quando o esquema é rediss://', () => {
    expect(montarConexaoRedis({ redisUrl: 'rediss://:senha@host:6380' }).tls).toEqual({});
  });

  it('usa a porta 6379 quando a REDIS_URL não tem porta', () => {
    expect(montarConexaoRedis({ redisUrl: 'redis://host' }).port).toBe(6379);
  });
});
