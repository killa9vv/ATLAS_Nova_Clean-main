/**
 * Validação de dígito verificador de CPF/CNPJ (formato + checksum real, não só
 * contagem de dígitos) — evita cadastrar documentos obviamente inválidos
 * (sequências repetidas, dígitos verificadores errados) sem depender de
 * serviço externo. Aceita com ou sem máscara; a checagem trabalha só com dígitos.
 */
function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

function calcularDigitoCpf(digitos: string, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    soma += Number(digitos[i]) * (pesoInicial - i);
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function validarCpf(cpf: string): boolean {
  const digitos = apenasDigitos(cpf);
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
    return false;
  }

  const digito1 = calcularDigitoCpf(digitos.slice(0, 9), 10);
  const digito2 = calcularDigitoCpf(digitos.slice(0, 9) + digito1, 11);
  return digitos === digitos.slice(0, 9) + String(digito1) + String(digito2);
}

function calcularDigitoCnpj(digitos: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    soma += Number(digitos[i]) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCnpj(cnpj: string): boolean {
  const digitos = apenasDigitos(cnpj);
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) {
    return false;
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digito1 = calcularDigitoCnpj(digitos.slice(0, 12), pesos1);
  const digito2 = calcularDigitoCnpj(digitos.slice(0, 12) + digito1, pesos2);
  return digitos === digitos.slice(0, 12) + String(digito1) + String(digito2);
}
