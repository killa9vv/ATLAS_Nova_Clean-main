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
  CORS_ORIGIN: Joi.string().allow('').optional(),
  MERCADOPAGO_ACCESS_TOKEN: Joi.string().allow('').optional(),
  MERCADOPAGO_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  MERCADOPAGO_NOTIFICATION_URL: Joi.string().uri().allow('').optional(),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional(),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional(),
  MELHOR_ENVIO_TOKEN: Joi.string().allow('').optional(),
  MELHOR_ENVIO_BASE_URL: Joi.string().uri().optional(),
  MELHOR_ENVIO_USER_AGENT: Joi.string().allow('').optional(),
  CEP_ORIGEM: Joi.string()
    .pattern(/^\d{8}$/)
    .allow('')
    .optional(),
}).unknown(true); // não rejeita outras variáveis de ambiente do sistema (PATH, etc.)
