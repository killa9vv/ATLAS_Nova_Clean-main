import { envValidationSchema } from './env-validation.schema';

const ENV_VALIDO = {
  DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/atlas_nova_clean',
  JWT_SECRET: 'um-segredo-com-pelo-menos-16-caracteres',
};

describe('envValidationSchema', () => {
  it('aceita o mínimo necessário (DATABASE_URL + JWT_SECRET) e aplica defaults', () => {
    const { error, value } = envValidationSchema.validate(ENV_VALIDO);

    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3000);
  });

  it('rejeita quando DATABASE_URL está ausente', () => {
    const { error } = envValidationSchema.validate({ JWT_SECRET: ENV_VALIDO.JWT_SECRET });
    expect(error?.message).toMatch(/DATABASE_URL/);
  });

  it('rejeita DATABASE_URL que não é uma URI postgresql/postgres válida', () => {
    const { error } = envValidationSchema.validate({
      ...ENV_VALIDO,
      DATABASE_URL: 'mysql://usuario:senha@localhost:3306/db',
    });
    expect(error?.message).toMatch(/DATABASE_URL/);
  });

  it('rejeita quando JWT_SECRET está ausente', () => {
    const { error } = envValidationSchema.validate({ DATABASE_URL: ENV_VALIDO.DATABASE_URL });
    expect(error?.message).toMatch(/JWT_SECRET/);
  });

  it('rejeita JWT_SECRET curto demais (segredo trivial)', () => {
    const { error } = envValidationSchema.validate({ ...ENV_VALIDO, JWT_SECRET: 'curto' });
    expect(error?.message).toMatch(/JWT_SECRET/);
  });

  it('rejeita NODE_ENV fora dos valores esperados', () => {
    const { error } = envValidationSchema.validate({ ...ENV_VALIDO, NODE_ENV: 'staging' });
    expect(error?.message).toMatch(/NODE_ENV/);
  });

  it('não rejeita outras variáveis de ambiente do sistema (unknown(true))', () => {
    const { error } = envValidationSchema.validate({
      ...ENV_VALIDO,
      PATH: '/usr/bin',
      ALGUMA_VARIAVEL_QUE_NAO_CONHECEMOS: 'x',
    });
    expect(error).toBeUndefined();
  });

  it('aceita as integrações externas (Mercado Pago, Cloudinary) vazias ou ausentes', () => {
    const { error } = envValidationSchema.validate({
      ...ENV_VALIDO,
      MERCADOPAGO_ACCESS_TOKEN: '',
      CLOUDINARY_CLOUD_NAME: '',
    });
    expect(error).toBeUndefined();
  });
});
