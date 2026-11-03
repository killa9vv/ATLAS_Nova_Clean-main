export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function formatarCep(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

// O backend aceita esse formato (ver REGEX_TELEFONE nos DTOs de contato e de cliente).
export function formatarTelefone(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  // 8 dígitos depois do DDD é fixo (4+4); a partir de 9, celular (5+4).
  const corte = resto.length > 8 ? 5 : 4;
  return resto.length > corte
    ? `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
    : `(${ddd}) ${resto}`;
}

export function telefoneValido(telefone: string): boolean {
  const total = somenteDigitos(telefone).length;
  return total === 0 || total === 10 || total === 11;
}
