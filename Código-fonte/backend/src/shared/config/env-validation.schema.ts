import * as Joi from 'joi';

/**
 * Valida as variáveis de ambiente na subida da aplicação — falha rápido (e com uma
 * mensagem clara) se algo obrigatório estiver faltando ou mal formado, em vez de deixar
 * o erro estourar mais tarde num lugar aleatório (ex.: JwtService.sign() com secret
 * undefined, ou uma query com DATABASE_URL inválida).
 *
 * Só DATABASE_URL e JWT_SECRET são obrigatórios — as integrações externas (Mercado
 * Pago, Cloudinary) ficam opcionais aqui de propósito: dá pra rodar a API localmente
 * sem essas credenciais, só os endpoints que dependem delas é que falham na hora do uso.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  JWT_SECRET: Joi.string().min(16).required(),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').optional(),
  CORS_ORIGIN: Joi.string().allow('').optional(),
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().allow('').optional(),
  MERCADOPAGO_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  MERCADOPAGO_NOTIFICATION_URL: Joi.string().uri().allow('').optional(),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional(),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional(),
  // "false" desliga a remoção de fundo por IA no upload (ver CloudinaryStorageAdapter).
  CLOUDINARY_REMOVER_FUNDO: Joi.string().valid('true', 'false', '').optional(),
  // Frete: opcionais de propósito (mesmo padrão do Mercado Pago/Cloudinary acima) —
  // sem MELHOR_ENVIO_TOKEN/FRETE_CEP_ORIGEM, ShippingQuoteProviderComFallback cai
  // direto pra tabela regional, então a API sobe normalmente em dev sem essas chaves.
  MELHOR_ENVIO_TOKEN: Joi.string().allow('').optional(),
  MELHOR_ENVIO_BASE_URL: Joi.string().uri().allow('').optional(),
  FRETE_CEP_ORIGEM: Joi.string().allow('').optional(),
  // Sem valor definido = regra de frete grátis desligada (nenhum pedido se qualifica).
  FRETE_GRATIS_ACIMA_DE: Joi.number().positive().optional(),
  // E-mails transacionais: mesmo padrão opcional acima — sem RESEND_API_KEY,
  // NullEmailSenderAdapter assume e só loga (ver emails.module.ts).
  RESEND_API_KEY: Joi.string().allow('').optional(),
  EMAIL_FROM: Joi.string().allow('').optional(),
  FRONTEND_URL: Joi.string().uri().allow('').optional(),
  // REDIS_URL (com senha) tem prioridade sobre REDIS_HOST/REDIS_PORT — ver
  // montar-conexao-redis.ts.
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .allow('')
    .optional(),
  REDIS_HOST: Joi.string().allow('').optional(),
  REDIS_PORT: Joi.number().port().optional(),
  // Monitoramento de erros — opcional: sem DSN, nada é enviado (ver sentry.ts).
  SENTRY_DSN: Joi.string().uri().allow('').optional(),
}).unknown(true); // não rejeita outras variáveis de ambiente do sistema (PATH, etc.)
