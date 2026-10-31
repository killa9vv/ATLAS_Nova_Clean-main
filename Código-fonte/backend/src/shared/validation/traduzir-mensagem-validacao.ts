// Traduz as mensagens padrão do class-validator (em inglês) pra português antes de
// chegarem no front — sem isso o usuário via coisas como "senha must be longer than
// or equal to 6 characters". Mensagens personalizadas nos DTOs (ex.: telefone em
// registrar-cliente.dto.ts) não batem com nenhum padrão abaixo e passam intactas.
//
// Os padrões espelham os textos da versão instalada do class-validator (ver
// node_modules/class-validator/cjs/decorator/**). `campo` pode vir com o caminho de
// um objeto aninhado (ex.: "itens.0.quantidade") — o ValidationPipe do Nest já
// prefixa assim.

type Tradutor = (campo: string, valor: string) => string;

const PADROES: Array<[RegExp, Tradutor]> = [
  [/^(.+) should not be empty$/, (c) => `${c} é obrigatório`],
  [/^(.+) should not be null or undefined$/, (c) => `${c} é obrigatório`],
  [/^(.+) must be a string$/, (c) => `${c} deve ser um texto`],
  [/^(.+) must be an integer number$/, (c) => `${c} deve ser um número inteiro`],
  [
    /^(.+) must be a number conforming to the specified constraints$/,
    (c) => `${c} deve ser um número`,
  ],
  [/^(.+) must be a boolean value$/, (c) => `${c} deve ser verdadeiro ou falso`],
  [/^(.+) must be a boolean string$/, (c) => `${c} deve ser "true" ou "false"`],
  [/^(.+) must be an array$/, (c) => `${c} deve ser uma lista`],
  [/^(.+) must be a Date instance$/, (c) => `${c} deve ser uma data`],
  [/^(.+) must be a valid ISO 8601 date string$/, (c) => `${c} deve ser uma data válida`],
  [/^(.+) must be an email$/, (c) => `${c} deve ser um e-mail válido`],
  [/^(.+) must be a UUID$/, (c) => `${c} deve ser um identificador válido`],
  [/^(.+) must be a URL address$/, (c) => `${c} deve ser um endereço (URL) válido`],
  [/^(.+) must match .+ regular expression$/, (c) => `${c} está em um formato inválido`],
  [/^(.+) must not be less than (.+)$/, (c, v) => `${c} deve ser no mínimo ${v}`],
  [/^(.+) must not be greater than (.+)$/, (c, v) => `${c} deve ser no máximo ${v}`],
  [
    /^(.+) must be longer than or equal to (\d+) characters$/,
    (c, v) => `${c} deve ter pelo menos ${v} caracteres`,
  ],
  [
    /^(.+) must be shorter than or equal to (\d+) characters$/,
    (c, v) => `${c} deve ter no máximo ${v} caracteres`,
  ],
  [
    /^(.+) must contain at least (\d+) elements$/,
    (c, v) => `${c} deve ter pelo menos ${v} ${v === '1' ? 'item' : 'itens'}`,
  ],
  [
    /^(.+) must be one of the following values: (.*)$/,
    (c, v) => `${c} deve ser um destes valores: ${v}`,
  ],
  [
    /^nested property (.+) must be either object or array$/,
    (c) => `${c} deve ser um objeto ou lista`,
  ],
  [/^property (.+) should not exist$/, (c) => `o campo ${c} não é permitido`],
];

const PREFIXO_CADA = 'each value in ';

export function traduzirMensagemValidacao(mensagem: string): string {
  // "each value in X must be ..." (decorators com { each: true }) — traduz o resto e
  // marca que vale pra cada item da lista.
  const cadaItem = mensagem.startsWith(PREFIXO_CADA);
  const semPrefixo = cadaItem ? mensagem.slice(PREFIXO_CADA.length) : mensagem;

  for (const [padrao, traduzir] of PADROES) {
    const encontrado = semPrefixo.match(padrao);
    if (encontrado) {
      const traduzida = traduzir(encontrado[1], encontrado[2] ?? '');
      return cadaItem ? `cada item de ${traduzida}` : traduzida;
    }
  }
  return mensagem;
}
