import { traduzirMensagemValidacao } from './traduzir-mensagem-validacao';

describe('traduzirMensagemValidacao', () => {
  it.each([
    [
      'senha must be longer than or equal to 6 characters',
      'senha deve ter pelo menos 6 caracteres',
    ],
    [
      'nome must be shorter than or equal to 150 characters',
      'nome deve ter no máximo 150 caracteres',
    ],
    ['nome should not be empty', 'nome é obrigatório'],
    ['email must be an email', 'email deve ser um e-mail válido'],
    ['preco must be a number conforming to the specified constraints', 'preco deve ser um número'],
    ['itens.0.quantidade must not be less than 1', 'itens.0.quantidade deve ser no mínimo 1'],
    ['nota must not be greater than 5', 'nota deve ser no máximo 5'],
    ['itens must contain at least 1 elements', 'itens deve ter pelo menos 1 item'],
    [
      'tipoEntrega must be one of the following values: ENTREGA, RETIRADA',
      'tipoEntrega deve ser um destes valores: ENTREGA, RETIRADA',
    ],
    ['property campoInventado should not exist', 'o campo campoInventado não é permitido'],
    ['cep must match /^\\d{8}$/ regular expression', 'cep está em um formato inválido'],
    ['each value in tags must be a string', 'cada item de tags deve ser um texto'],
  ])('"%s" → "%s"', (original, esperado) => {
    expect(traduzirMensagemValidacao(original)).toBe(esperado);
  });

  it('mantém mensagens personalizadas dos DTOs como estão', () => {
    const personalizada = 'telefone deve estar em um formato válido, ex.: (22) 99999-8888';
    expect(traduzirMensagemValidacao(personalizada)).toBe(personalizada);
  });
});
