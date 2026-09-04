// Este filtro é a única fronteira onde o domínio vira HTTP. Um código que sai da
// tabela (ou entra nela sem status) faz a API devolver 400 pra algo que deveria ser
// 404/409/503 — sem quebrar nenhum teste de caso de uso. Por isso a tabela inteira
// fica travada aqui, junto do fallback e da regra de log (5xx é problema nosso,
// 4xx é do cliente e não vira ruído no log).
import { ArgumentsHost, Logger } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import { DomainException } from './domain.exception';

/** Dublê concreto: DomainException é abstrata e só define `code` como contrato. */
class ExcecaoDeTeste extends DomainException {
  readonly code: string;

  constructor(code: string, mensagem = 'algo deu errado') {
    super(mensagem);
    this.code = code;
  }
}

/**
 * Espelho da tabela do filtro. É duplicação proposital: mudar um status exige
 * mudar os dois lados, e o teste `não deixa nenhum código sem cobertura` abaixo
 * garante que os dois não saiam de sincronia.
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
  ['CLIENTE_NAO_ENCONTRADO', 404],
  ['DOCUMENTO_INVALIDO', 400],
  ['ENDERECO_NAO_ENCONTRADO', 404],
  ['CEP_INVALIDO', 400],
  ['CEP_NAO_ENCONTRADO', 404],
  ['CEP_INDISPONIVEL', 503],
  ['CUPOM_NAO_ENCONTRADO', 404],
  ['CUPOM_CODIGO_DUPLICADO', 409],
  ['CUPOM_INVALIDO', 409],
  ['BANNER_NAO_ENCONTRADO', 404],
  ['CREDENCIAIS_INVALIDAS', 401],
  ['TOKEN_RECUPERACAO_INVALIDO', 400],
  ['ENDERECO_PADRAO_UNICO', 409],
];

describe('DomainExceptionFilter', () => {
  let filter: DomainExceptionFilter;
  let response: { status: jest.Mock; json: jest.Mock };
  let getResponse: jest.Mock;
  let switchToHttp: jest.Mock;
  let host: ArgumentsHost;
  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    getResponse = jest.fn(() => response);
    switchToHttp = jest.fn(() => ({ getResponse }));
    host = { switchToHttp } as unknown as ArgumentsHost;

    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter = new DomainExceptionFilter();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('tradução de código de domínio para status HTTP', () => {
    it.each(MAPEAMENTO)('traduz %s para HTTP %i', (code, statusEsperado) => {
      filter.catch(new ExcecaoDeTeste(code, 'mensagem do domínio'), host);

      expect(response.status).toHaveBeenCalledWith(statusEsperado);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: statusEsperado,
        erro: code,
        mensagem: 'mensagem do domínio',
      });
    });

    it('não deixa nenhum código da tabela sem cobertura neste arquivo', () => {
      const tabelaReal = (
        DomainExceptionFilter as unknown as { STATUS_POR_CODIGO: Record<string, number> }
      ).STATUS_POR_CODIGO;

      expect(tabelaReal).toEqual(Object.fromEntries(MAPEAMENTO));
    });
  });

  describe('fallback', () => {
    it('devolve 400 para um código de domínio ainda não registrado na tabela', () => {
      filter.catch(new ExcecaoDeTeste('CODIGO_NUNCA_REGISTRADO', 'erro novo'), host);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 400,
        erro: 'CODIGO_NUNCA_REGISTRADO',
        mensagem: 'erro novo',
      });
    });

    it('não loga o fallback — 400 é erro do cliente, não incidente', () => {
      filter.catch(new ExcecaoDeTeste('CODIGO_NUNCA_REGISTRADO'), host);

      expect(loggerError).not.toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it.each(MAPEAMENTO.filter(([, status]) => status >= 500))(
      'loga %s (HTTP %i) com código, mensagem e stack',
      (code) => {
        const excecao = new ExcecaoDeTeste(code, 'gateway fora do ar');

        filter.catch(excecao, host);

        expect(loggerError).toHaveBeenCalledTimes(1);
        expect(loggerError).toHaveBeenCalledWith(`${code}: gateway fora do ar`, excecao.stack);
      },
    );

    it('responde normalmente ao cliente mesmo quando loga o 5xx', () => {
      filter.catch(new ExcecaoDeTeste('GATEWAY_INDISPONIVEL', 'gateway fora do ar'), host);

      expect(response.status).toHaveBeenCalledWith(503);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 503,
        erro: 'GATEWAY_INDISPONIVEL',
        mensagem: 'gateway fora do ar',
      });
    });

    it.each(MAPEAMENTO.filter(([, status]) => status < 500))(
      'não loga %s (HTTP %i) — erro do cliente não vira ruído',
      (code) => {
        filter.catch(new ExcecaoDeTeste(code), host);

        expect(loggerError).not.toHaveBeenCalled();
      },
    );
  });

  describe('integração com o ArgumentsHost', () => {
    it('escreve no response obtido do contexto HTTP do host', () => {
      filter.catch(new ExcecaoDeTeste('PEDIDO_NAO_ENCONTRADO'), host);

      expect(switchToHttp).toHaveBeenCalledTimes(1);
      expect(getResponse).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledTimes(1);
    });

    it('encadeia json() no retorno de status(), como o contrato do express exige', () => {
      filter.catch(new ExcecaoDeTeste('PEDIDO_NAO_ENCONTRADO'), host);

      expect(response.status.mock.results[0].value).toBe(response);
      expect(response.status.mock.invocationCallOrder[0]).toBeLessThan(
        response.json.mock.invocationCallOrder[0],
      );
    });
  });

  describe('mensagem da exceção', () => {
    it('repassa a mensagem do domínio sem reescrever nem truncar', () => {
      const mensagem = 'Estoque insuficiente para o produto Detergente (restam 2, pedidos 5).';

      filter.catch(new ExcecaoDeTeste('ESTOQUE_INSUFICIENTE', mensagem), host);

      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({ mensagem, erro: 'ESTOQUE_INSUFICIENTE' }),
      );
    });

    it('lida com mensagem vazia sem quebrar a resposta', () => {
      filter.catch(new ExcecaoDeTeste('CARRINHO_VAZIO', ''), host);

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 400,
        erro: 'CARRINHO_VAZIO',
        mensagem: '',
      });
    });
  });
});
