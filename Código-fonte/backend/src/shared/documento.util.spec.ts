import { validarCnpj, validarCpf } from './documento.util';

describe('validarCpf', () => {
  it('aceita CPF válido, com ou sem máscara', () => {
    expect(validarCpf('111.444.777-35')).toBe(true);
    expect(validarCpf('11144477735')).toBe(true);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(validarCpf('11144477736')).toBe(false);
  });

  it('rejeita sequência repetida (ex.: 111.111.111-11)', () => {
    expect(validarCpf('11111111111')).toBe(false);
  });

  it('rejeita quantidade errada de dígitos', () => {
    expect(validarCpf('123')).toBe(false);
  });
});

describe('validarCnpj', () => {
  it('aceita CNPJ válido, com ou sem máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11222333000181')).toBe(true);
  });

  it('rejeita CNPJ com dígito verificador errado', () => {
    expect(validarCnpj('11222333000182')).toBe(false);
  });

  it('rejeita sequência repetida', () => {
    expect(validarCnpj('11111111111111')).toBe(false);
  });
});
