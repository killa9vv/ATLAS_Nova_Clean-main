import { randomBytes, createHash } from 'crypto';

/** Token opaco de alta entropia (refresh token, recuperação de senha) — não é JWT,
 * não carrega payload nenhum, só prova posse. Só o hash (sha256, suficiente pra um
 * valor de 256 bits gerado aleatoriamente — diferente de senha, não precisa de
 * bcrypt/custo computacional) é persistido; o valor cru só existe na resposta HTTP
 * uma vez, no momento da emissão. */
export function gerarTokenOpaco(): { valor: string; hash: string } {
  const valor = randomBytes(32).toString('hex');
  return { valor, hash: hashToken(valor) };
}

export function hashToken(valor: string): string {
  return createHash('sha256').update(valor).digest('hex');
}
