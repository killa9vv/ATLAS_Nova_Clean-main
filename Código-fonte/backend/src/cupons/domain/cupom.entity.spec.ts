import { Cupom } from './cupom.entity';

function criarCupom(overrides: Partial<Cupom> = {}): Cupom {
  return new Cupom(
    overrides.id ?? 'cupom-1',
    overrides.codigo ?? 'DESCONTO10',
    overrides.tipoDesconto ?? 'PERCENTUAL',
    overrides.valor ?? 10,
    overrides.ativo ?? true,
    overrides.usosCount ?? 0,
    overrides.createdAt ?? new Date(),
    overrides.validoAte,
    overrides.usoMaximo,
  );
}

describe('Cupom.estaValido', () => {
  it('é válido por padrão (ativo, sem validade nem limite de uso)', () => {
    expect(criarCupom().estaValido()).toBe(true);
  });

  it('é inválido quando inativo', () => {
    expect(criarCupom({ ativo: false }).estaValido()).toBe(false);
  });

  it('é inválido quando validoAte já passou', () => {
    const cupom = criarCupom({ validoAte: new Date('2020-01-01') });
    expect(cupom.estaValido(new Date('2020-06-01'))).toBe(false);
  });

  it('é válido quando validoAte ainda não chegou', () => {
    const cupom = criarCupom({ validoAte: new Date('2030-01-01') });
    expect(cupom.estaValido(new Date('2026-01-01'))).toBe(true);
  });

  it('é inválido quando usosCount já atingiu usoMaximo', () => {
    expect(criarCupom({ usoMaximo: 5, usosCount: 5 }).estaValido()).toBe(false);
  });

  it('é válido quando usosCount ainda não atingiu usoMaximo', () => {
    expect(criarCupom({ usoMaximo: 5, usosCount: 4 }).estaValido()).toBe(true);
  });
});

describe('Cupom.calcularDesconto', () => {
  it('PERCENTUAL calcula a porcentagem do subtotal', () => {
    const cupom = criarCupom({ tipoDesconto: 'PERCENTUAL', valor: 10 });
    expect(cupom.calcularDesconto(100)).toBe(10);
  });

  it('VALOR_FIXO usa o valor fixo direto quando cabe no subtotal', () => {
    const cupom = criarCupom({ tipoDesconto: 'VALOR_FIXO', valor: 15 });
    expect(cupom.calcularDesconto(100)).toBe(15);
  });

  it('VALOR_FIXO nunca excede o subtotal (evita total negativo)', () => {
    const cupom = criarCupom({ tipoDesconto: 'VALOR_FIXO', valor: 50 });
    expect(cupom.calcularDesconto(20)).toBe(20);
  });

  it('PERCENTUAL de 100% zera o total sem passar dele', () => {
    const cupom = criarCupom({ tipoDesconto: 'PERCENTUAL', valor: 100 });
    expect(cupom.calcularDesconto(35.5)).toBe(35.5);
  });
});
