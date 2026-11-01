import * as Sentry from '@sentry/nestjs';
import type { ErrorEvent } from '@sentry/nestjs';
import { limparDadosPessoais, reportarErroAoSentry } from './sentry';

jest.mock('@sentry/nestjs', () => ({
  isEnabled: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
}));

const sentry = jest.mocked(Sentry);

describe('limparDadosPessoais', () => {
  it('remove corpo, cookies, headers de autenticação e usuário', () => {
    const evento = {
      request: {
        data: { senha: '123', cpf: '111.444.777-35' },
        cookies: { sessao: 'abc' },
        headers: { authorization: 'Bearer x', 'x-cart-session': 's', 'user-agent': 'Chrome' },
      },
      user: { email: 'maria@teste.com' },
    } as unknown as ErrorEvent;

    const limpo = limparDadosPessoais(evento);

    expect(limpo.request?.data).toBeUndefined();
    expect(limpo.request?.cookies).toBeUndefined();
    expect(limpo.request?.headers).toEqual({ 'user-agent': 'Chrome' });
    expect(limpo.user).toBeUndefined();
  });

  it('mascara e-mail, CPF/CNPJ e tokens em mensagens, exceções e URLs', () => {
    const evento = {
      message: 'Falha ao enviar pra maria@teste.com (CPF 111.444.777-35)',
      exception: { values: [{ value: 'CNPJ 11.222.333/0001-81 inválido' }] },
      request: { url: 'https://site/conta/ativar-conta?token=segredo123&x=1' },
    } as unknown as ErrorEvent;

    const limpo = limparDadosPessoais(evento);

    expect(limpo.message).toBe('Falha ao enviar pra [email] (CPF [documento])');
    expect(limpo.exception?.values?.[0].value).toBe('CNPJ [documento] inválido');
    expect(limpo.request?.url).toBe('https://site/conta/ativar-conta?token=[removido]&x=1');
  });
});

describe('reportarErroAoSentry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não faz nada quando o Sentry não está configurado (sem SENTRY_DSN)', () => {
    sentry.isEnabled.mockReturnValue(false);

    reportarErroAoSentry(new Error('qualquer'), []);

    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('manda Error como exceção, com o contexto do Logger como tag', () => {
    sentry.isEnabled.mockReturnValue(true);
    const erro = new Error('Resend fora do ar');

    reportarErroAoSentry(erro, ['EnvioDiretoEmailQueueAdapter']);

    expect(sentry.captureException).toHaveBeenCalledWith(erro, {
      tags: { contexto: 'EnvioDiretoEmailQueueAdapter' },
    });
  });

  it('reconstrói a exceção do objeto do GlobalExceptionFilter (erro 5xx)', () => {
    sentry.isEnabled.mockReturnValue(true);

    reportarErroAoSentry(
      {
        event: 'http_request_error',
        requestId: 'req-1',
        path: '/pedidos',
        statusCode: 500,
        erro: 'ERRO_INTERNO',
        exception: { name: 'TypeError', message: 'x is undefined', stack: 'TypeError: x…' },
      },
      [],
    );

    const [erro, contexto] = sentry.captureException.mock.calls[0] as [Error, { tags: object }];
    expect(erro.name).toBe('TypeError');
    expect(erro.message).toBe('x is undefined');
    expect(contexto.tags).toEqual({ erro: 'ERRO_INTERNO', statusCode: '500' });
  });

  it('manda texto (Logger do Nest) como erro com o nome de quem registrou', () => {
    sentry.isEnabled.mockReturnValue(true);

    reportarErroAoSentry('Pagamento aprovado mas sem estoque', ['ReconciliarPedidoService']);

    const [erro, contexto] = sentry.captureException.mock.calls[0] as [Error, { tags: object }];
    expect(erro.name).toBe('ReconciliarPedidoService');
    expect(erro.message).toBe('Pagamento aprovado mas sem estoque');
    expect(erro.stack).not.toContain('reportarErroAoSentry');
    expect(contexto.tags).toEqual({ contexto: 'ReconciliarPedidoService' });
    expect(sentry.captureMessage).not.toHaveBeenCalled();
  });
});
