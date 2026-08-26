import { validarCorsOrigin } from './validar-cors-origin';

describe('validarCorsOrigin', () => {
  it('lança erro quando NODE_ENV=production e CORS_ORIGIN não está definido', () => {
    expect(() => validarCorsOrigin(undefined, 'production')).toThrow(/CORS_ORIGIN/);
  });

  it('lança erro quando NODE_ENV=production e CORS_ORIGIN é string vazia', () => {
    expect(() => validarCorsOrigin('', 'production')).toThrow(/CORS_ORIGIN/);
  });

  it('não lança erro quando NODE_ENV=production e CORS_ORIGIN está definido', () => {
    expect(() => validarCorsOrigin('https://atlasnovaclean.com', 'production')).not.toThrow();
  });

  it('não lança erro quando CORS_ORIGIN não está definido fora de produção', () => {
    expect(() => validarCorsOrigin(undefined, 'development')).not.toThrow();
    expect(() => validarCorsOrigin(undefined, undefined)).not.toThrow();
  });
});
