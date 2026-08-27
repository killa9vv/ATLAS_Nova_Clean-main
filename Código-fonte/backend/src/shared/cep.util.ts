/** CEP brasileiro: exatamente 8 dígitos, com ou sem máscara (00000-000). */
export function formatoCepValido(cep: string): boolean {
  return /^\d{8}$/.test(apenasDigitosCep(cep));
}

export function apenasDigitosCep(cep: string): string {
  return cep.replace(/\D/g, '');
}
