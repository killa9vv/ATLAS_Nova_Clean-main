import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { PinoLoggerService } from './pino-logger.service';
import { DomainException } from '../exceptions/domain.exception';

/** Dublê concreto: DomainException é abstrata e só define `code` como contrato. */
class ExcecaoDeTeste extends DomainException {
  readonly code: string;

  constructor(code: string, mensagem = 'algo deu errado') {
    super(mensagem);
    this.code = code;
  }
}

/**
 * Espelho da tabela do filtro — duplicação proposital, mesmo padrão de
 * DomainExceptionFilter.spec.ts. Esta tabela existe DUAS vezes no código-fonte
 * (aqui e em DomainExceptionFilter) porque main.ts só registra
 * GlobalExceptionFilter — DomainExceptionFilter só é usado pelos testes e2e
 * (cada um monta o próprio app de teste manualmente). Um código que só é
 * adicionado numa das duas tabelas passa nos testes e2e mas devolve o status
 * errado na API de verdade — foi exatamente isso que aconteceu com os códigos de
 * cupom deste card antes deste teste existir aqui.
 */
const MAPEAMENTO: Array<[string, number]> = [
  ['PEDIDO_NAO_ENCONTRADO', 404],
  ['PAGAMENTO_NAO_ENCONTRADO', 404],
  ['PRODUTO_NAO_ENCONTRADO', 404],
  ['ESTOQUE_INSUFICIENTE', 409],
  ['CARRINHO_VAZIO', 400],
  ['PEDIDO_EM_STATUS_INVALIDO', 409],
  ['PAGAMENTO_RECUSADO', 402],
  ['GATEWAY_INDISPONIVEL', 503],
  ['CREDENCIAIS_GATEWAY_INVALIDAS', 502],
  ['PAGAMENTO_DUPLICADO', 409],
  ['CATEGORIA_NAO_ENCONTRADA', 404],
  ['CATEGORIA_COM_PRODUTOS_VINCULADOS', 409],
  ['MARCA_NAO_ENCONTRADA', 404],
  ['MARCA_COM_PRODUTOS_VINCULADOS', 409],
  ['MARCA_DUPLICADA', 409],
  ['IMAGEM_PRODUTO_NAO_ENCONTRADA', 404],
  ['PRECO_PROMOCIONAL_INVALIDO', 400],
  ['CLIENTE_NAO_ENCONTRADO', 404],
  ['DOCUMENTO_INVALIDO', 400],
  ['ENDERECO_NAO_ENCONTRADO', 404],
  ['CEP_INVALIDO', 400],
  ['CEP_NAO_ENCONTRADO', 404],
  ['CEP_INDISPONIVEL', 503],
  ['CUPOM_NAO_ENCONTRADO', 404],
  ['CUPOM_VALOR_INVALIDO', 400],
  ['CUPOM_CODIGO_DUPLICADO', 409],
  ['CUPOM_CODIGO_INVALIDO', 409],
  ['CUPOM_INATIVO', 409],
  ['CUPOM_EXPIRADO', 409],
  ['CUPOM_ESGOTADO', 409],
  ['CUPOM_VALOR_MINIMO_NAO_ATINGIDO', 409],
  ['CUPOM_NAO_APLICAVEL_ITENS', 409],
  ['CUPOM_LIMITE_USO_CLIENTE_EXCEDIDO', 409],
  ['REGRA_ATACADO_NAO_ENCONTRADA', 404],
  ['REGRA_ATACADO_VALOR_INVALIDO', 400],
  ['REGRA_ATACADO_ALVO_INVALIDO', 400],
  ['BANNER_NAO_ENCONTRADO', 404],
  ['CREDENCIAIS_INVALIDAS', 401],
  ['TOKEN_RECUPERACAO_INVALIDO', 400],
  ['EMAIL_JA_CADASTRADO', 409],
  ['ENDERECO_PADRAO_UNICO', 409],
];

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let logger: PinoLoggerService;

  beforeEach(() => {
    logger = {
      error: jest.fn(),
    } as unknown as PinoLoggerService;

    filter = new GlobalExceptionFilter(logger);
  });

  function criarHost() {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const request = {
      method: 'POST',
      originalUrl: '/teste',
      url: '/teste',
      requestId: 'request-123',
    };

    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    return { host, response };
  }

  describe('tradução de código de domínio para status HTTP', () => {
    it.each(MAPEAMENTO)('traduz %s para HTTP %i', (code, statusEsperado) => {
      const { host, response } = criarHost();

      filter.catch(new ExcecaoDeTeste(code, 'mensagem do domínio'), host);

      expect(response.status).toHaveBeenCalledWith(statusEsperado);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: statusEsperado,
          erro: code,
          mensagem: 'mensagem do domínio',
        }),
      );
    });

    it('não deixa nenhum código da tabela sem cobertura neste arquivo', () => {
      const tabelaReal = (
        GlobalExceptionFilter as unknown as { STATUS_POR_CODIGO: Record<string, number> }
      ).STATUS_POR_CODIGO;

      expect(tabelaReal).toEqual(Object.fromEntries(MAPEAMENTO));
    });
  });

  it('padroniza erros de validacao', () => {
    const { host, response } = criarHost();

    filter.catch(
      new BadRequestException(['nome should not be empty', 'preco must be a number']),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        erro: 'VALIDACAO_FALHOU',
        mensagem: ['nome should not be empty', 'preco must be a number'],
        requestId: 'request-123',
        path: '/teste',
      }),
    );
  });

  it('nao expoe detalhes internos em erro inesperado', () => {
    const { host, response } = criarHost();

    filter.catch(new Error('senha-do-banco-nao-deve-aparecer'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        erro: 'ERRO_INTERNO',
        mensagem: 'Erro interno do servidor.',
        requestId: 'request-123',
      }),
    );

    const corpo = response.json.mock.calls[0][0];
    expect(JSON.stringify(corpo)).not.toContain('senha-do-banco-nao-deve-aparecer');

    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
