import { ConfigService } from '@nestjs/config';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// @react-email/render usa import() dinâmico de "react-dom/server" internamente
// (funciona normalmente no Node real, inclusive dentro do worker BullMQ em produção),
// mas o runtime de módulos do Jest não suporta import() dinâmico sem a flag
// --experimental-vm-modules. Troca por uma implementação síncrona equivalente
// (mesmo renderer usado por baixo do @react-email/render) só pra rodar sob Jest —
// ainda produz HTML real com os dados interpolados, então os asserts continuam
// verificando conteúdo de verdade, não um mock vazio.
jest.mock('@react-email/render', () => ({
  render: (node: ReactElement) => Promise.resolve(renderToStaticMarkup(node)),
}));

import { ProcessarEmailUseCase } from './processar-email.use-case';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { ContatoPedido, Pedido, ItemPedidoEntity } from '../../pedidos/domain/pedido.entity';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { EmailEnviadoRepository } from '../domain/email-enviado.repository';
import { EmailSender } from '../domain/email-sender.port';

function criarPedido(
  opcoes: {
    contato?: ContatoPedido;
    clienteId?: string;
    valorFrete?: number;
    desconto?: number;
  } = {},
): Pedido {
  const contato: ContatoPedido = opcoes.contato ?? {
    nome: 'Maria da Silva',
    email: 'maria@teste.com',
  };
  const clienteId = 'clienteId' in opcoes ? opcoes.clienteId : 'cliente-1';
  return new Pedido(
    'pedido-1',
    '2026-000001',
    StatusPedido.PAGO,
    [new ItemPedidoEntity('produto-1', 'Detergente', 2, 10)],
    20,
    'RETIRADA',
    opcoes.valorFrete ?? 0,
    new Date(),
    new Date(),
    undefined,
    undefined,
    contato,
    clienteId,
    opcoes.desconto ?? 0,
  );
}

describe('ProcessarEmailUseCase', () => {
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let emailEnviadoRepository: jest.Mocked<EmailEnviadoRepository>;
  let emailSender: jest.Mocked<EmailSender>;
  let configService: jest.Mocked<ConfigService>;
  let useCase: ProcessarEmailUseCase;

  beforeEach(() => {
    pedidoRepository = { buscarPorId: jest.fn() } as unknown as jest.Mocked<PedidoRepository>;
    emailEnviadoRepository = {
      jaEnviado: jest.fn().mockResolvedValue(false),
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EmailEnviadoRepository>;
    emailSender = {
      enviar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EmailSender>;
    configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<ConfigService>;

    useCase = new ProcessarEmailUseCase(
      pedidoRepository,
      emailEnviadoRepository,
      emailSender,
      configService,
    );
  });

  it('não reenvia um e-mail de pedido que já foi registrado como enviado (idempotência)', async () => {
    emailEnviadoRepository.jaEnviado.mockResolvedValue(true);

    await useCase.executar({ tipo: 'CONFIRMACAO_PEDIDO', pedidoId: 'pedido-1' });

    expect(pedidoRepository.buscarPorId).not.toHaveBeenCalled();
    expect(emailSender.enviar).not.toHaveBeenCalled();
  });

  it('não falha e não envia quando o pedido não é encontrado (pode ter sido excluído entre o enfileirar e o processar)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(null);

    await useCase.executar({ tipo: 'CONFIRMACAO_PEDIDO', pedidoId: 'pedido-inexistente' });

    expect(emailSender.enviar).not.toHaveBeenCalled();
    expect(emailEnviadoRepository.registrar).not.toHaveBeenCalled();
  });

  it('pula o envio quando o pedido não tem e-mail de contato (checkout via WhatsApp sem e-mail)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido({ contato: { nome: 'Maria' } }));

    await useCase.executar({ tipo: 'CONFIRMACAO_PEDIDO', pedidoId: 'pedido-1' });

    expect(emailSender.enviar).not.toHaveBeenCalled();
    expect(emailEnviadoRepository.registrar).not.toHaveBeenCalled();
  });

  it('renderiza o template com os dados reais do pedido, envia e registra o envio', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido());

    await useCase.executar({ tipo: 'CONFIRMACAO_PEDIDO', pedidoId: 'pedido-1' });

    expect(emailSender.enviar).toHaveBeenCalledTimes(1);
    const mensagem = emailSender.enviar.mock.calls[0][0];
    expect(mensagem.destinatario).toBe('maria@teste.com');
    expect(mensagem.assunto).toContain('2026-000001');
    expect(mensagem.html).toContain('2026-000001');
    expect(mensagem.html).toContain('Detergente');
    expect(mensagem.html).toContain('/conta/pedidos/pedido-1');

    expect(emailEnviadoRepository.registrar).toHaveBeenCalledWith(
      'CONFIRMACAO_PEDIDO',
      'pedido-1',
      'maria@teste.com',
    );
  });

  it('mostra frete e desconto entre os itens e o total, pro total bater com o que o cliente vê', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido({ valorFrete: 45, desconto: 5 }));

    await useCase.executar({ tipo: 'PAGAMENTO_APROVADO', pedidoId: 'pedido-1' });

    const { html } = emailSender.enviar.mock.calls[0][0];
    expect(html).toContain('Frete');
    expect(html).toContain('45,00');
    expect(html).toContain('Desconto');
    expect(html).toContain('5,00');
  });

  it('omite as linhas de frete e desconto quando os dois são zero (retirada sem cupom)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido());

    await useCase.executar({ tipo: 'CONFIRMACAO_PEDIDO', pedidoId: 'pedido-1' });

    const { html } = emailSender.enviar.mock.calls[0][0];
    expect(html).not.toContain('Frete');
    expect(html).not.toContain('Desconto');
  });

  it('não inclui link de acompanhamento quando o pedido não tem clienteId (checkout de convidado)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido({ clienteId: undefined }));

    await useCase.executar({ tipo: 'PAGAMENTO_APROVADO', pedidoId: 'pedido-1' });

    const mensagem = emailSender.enviar.mock.calls[0][0];
    expect(mensagem.html).not.toContain('/conta/pedidos/');
  });

  it('recuperação de senha: renderiza e envia direto, sem tocar em PedidoRepository/EmailEnviadoRepository', async () => {
    await useCase.executar({
      tipo: 'RECUPERACAO_SENHA',
      destinatario: 'ana@teste.com',
      nomeCliente: 'Ana Paula',
      token: 'token-abc-123',
    });

    expect(pedidoRepository.buscarPorId).not.toHaveBeenCalled();
    expect(emailEnviadoRepository.registrar).not.toHaveBeenCalled();
    expect(emailSender.enviar).toHaveBeenCalledTimes(1);
    const mensagem = emailSender.enviar.mock.calls[0][0];
    expect(mensagem.destinatario).toBe('ana@teste.com');
    expect(mensagem.html).toContain('token-abc-123');
  });

  it('ativação de conta: envia o link pra página de ativação com o token', async () => {
    await useCase.executar({
      tipo: 'ATIVACAO_CONTA',
      destinatario: 'ana@teste.com',
      nomeCliente: 'Ana Paula',
      token: 'token-ativacao-456',
    });

    expect(pedidoRepository.buscarPorId).not.toHaveBeenCalled();
    expect(emailEnviadoRepository.registrar).not.toHaveBeenCalled();
    const mensagem = emailSender.enviar.mock.calls[0][0];
    expect(mensagem.destinatario).toBe('ana@teste.com');
    expect(mensagem.assunto).toContain('Ative sua conta');
    expect(mensagem.html).toContain('/conta/ativar-conta?token=token-ativacao-456');
  });
});
