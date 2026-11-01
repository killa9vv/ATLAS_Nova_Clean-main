import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { EmailSender } from '../domain/email-sender.port';
import { EmailEnviadoRepository } from '../domain/email-enviado.repository';
import { TarefaEmail, TipoEmailPedido } from '../domain/tarefa-email';
import { DadosPedidoEmail } from '../infrastructure/templates/dados-pedido-email';
import { ConfirmacaoPedidoEmail } from '../infrastructure/templates/confirmacao-pedido.email';
import { PagamentoAprovadoEmail } from '../infrastructure/templates/pagamento-aprovado.email';
import { PedidoEnviadoEmail } from '../infrastructure/templates/pedido-enviado.email';
import { RecuperacaoSenhaEmail } from '../infrastructure/templates/recuperacao-senha.email';
import { AtivacaoContaEmail } from '../infrastructure/templates/ativacao-conta.email';
import { PagamentoRecusadoEmail } from '../infrastructure/templates/pagamento-recusado.email';
import { Pedido } from '../../pedidos/domain/pedido.entity';

const ASSUNTOS: Record<TipoEmailPedido, (numero: string) => string> = {
  CONFIRMACAO_PEDIDO: (numero) => `Recebemos seu pedido #${numero}`,
  PAGAMENTO_APROVADO: (numero) => `Pagamento do pedido #${numero} aprovado`,
  PEDIDO_ENVIADO: (numero) => `Seu pedido #${numero} saiu para entrega`,
};

/**
 * Consumida pelo worker do BullMQ. Re-busca o pedido pelo id em vez de confiar
 * em dados carregados no momento do enfileiramento — entre o enfileirar e o
 * processar pode ter passado tempo (retries, fila cheia) e o pedido é a fonte
 * da verdade atual (status, rastreio etc.).
 */
@Injectable()
export class ProcessarEmailUseCase {
  private readonly logger = new Logger(ProcessarEmailUseCase.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly emailEnviadoRepository: EmailEnviadoRepository,
    private readonly emailSender: EmailSender,
    configService: ConfigService,
  ) {
    this.frontendUrl = (
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  async executar(tarefa: TarefaEmail): Promise<void> {
    if (tarefa.tipo === 'RECUPERACAO_SENHA') {
      await this.processarRecuperacaoSenha(tarefa.destinatario, tarefa.nomeCliente, tarefa.token);
      return;
    }
    if (tarefa.tipo === 'ATIVACAO_CONTA') {
      await this.processarAtivacaoConta(tarefa.destinatario, tarefa.nomeCliente, tarefa.token);
      return;
    }
    if (tarefa.tipo === 'PAGAMENTO_RECUSADO') {
      await this.processarPagamentoRecusado(tarefa.pedidoId);
      return;
    }

    await this.processarEmailDePedido(tarefa.tipo, tarefa.pedidoId);
  }

  private async processarEmailDePedido(tipo: TipoEmailPedido, pedidoId: string): Promise<void> {
    if (await this.emailEnviadoRepository.jaEnviado(tipo, pedidoId)) {
      this.logger.log(`E-mail ${tipo} do pedido ${pedidoId} já foi enviado — ignorando.`);
      return;
    }

    const pedido = await this.pedidoRepository.buscarPorId(pedidoId);
    if (!pedido) {
      this.logger.warn(`Pedido ${pedidoId} não encontrado ao processar e-mail ${tipo}.`);
      return;
    }

    const destinatario = pedido.contato?.email;
    if (!destinatario) {
      this.logger.log(`Pedido ${pedidoId} sem e-mail de contato — pulando envio de ${tipo}.`);
      return;
    }

    const dados = this.montarDadosPedido(pedido);

    const html = await render(this.renderizarTemplate(tipo, dados));

    await this.emailSender.enviar({
      destinatario,
      assunto: ASSUNTOS[tipo](pedido.numero),
      html,
    });

    await this.emailEnviadoRepository.registrar(tipo, pedidoId, destinatario);
  }

  private async processarPagamentoRecusado(pedidoId: string): Promise<void> {
    const pedido = await this.pedidoRepository.buscarPorId(pedidoId);
    if (!pedido) {
      this.logger.warn(`Pedido ${pedidoId} não encontrado ao processar e-mail PAGAMENTO_RECUSADO.`);
      return;
    }

    // Reconfere na hora de enviar: entre a recusa e aqui o cliente pode ter pago com
    // outro cartão (pedido PAGO) ou já estar numa nova tentativa — aí o aviso só
    // confundiria.
    if (
      !pedido.estaAguardandoPagamento() ||
      !(await this.pedidoRepository.ultimaTentativaDePagamentoFalhou(pedidoId))
    ) {
      this.logger.log(
        `Pedido ${pedidoId} não está mais com pagamento recusado — e-mail não enviado.`,
      );
      return;
    }

    const destinatario = pedido.contato?.email;
    if (!destinatario) {
      this.logger.log(`Pedido ${pedidoId} sem e-mail de contato — pulando PAGAMENTO_RECUSADO.`);
      return;
    }

    const html = await render(
      PagamentoRecusadoEmail({
        ...this.montarDadosPedido(pedido),
        // Sem página pra pagar um pedido já existente: o carrinho não é limpo enquanto o
        // pagamento não aprova (ver checkout), então dali o cliente fecha de novo.
        linkTentarDeNovo: `${this.frontendUrl}/carrinho`,
      }),
    );

    await this.emailSender.enviar({
      destinatario,
      assunto: `Pagamento do pedido #${pedido.numero} não foi aprovado`,
      html,
    });
  }

  private montarDadosPedido(pedido: Pedido): DadosPedidoEmail {
    return {
      numero: pedido.numero,
      nomeCliente: pedido.contato?.nome ?? 'Cliente',
      itens: pedido.itens.map((item) => ({
        nome: item.nome,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      })),
      total: pedido.total,
      valorFrete: pedido.valorFrete,
      desconto: pedido.desconto,
      tipoEntrega: pedido.tipoEntrega,
      linkAcompanhamento: pedido.clienteId
        ? `${this.frontendUrl}/conta/pedidos/${pedido.id}`
        : undefined,
      codigoRastreio: pedido.codigoRastreio,
    };
  }

  private renderizarTemplate(tipo: TipoEmailPedido, dados: DadosPedidoEmail) {
    switch (tipo) {
      case 'CONFIRMACAO_PEDIDO':
        return ConfirmacaoPedidoEmail(dados);
      case 'PAGAMENTO_APROVADO':
        return PagamentoAprovadoEmail(dados);
      case 'PEDIDO_ENVIADO':
        return PedidoEnviadoEmail(dados);
    }
  }

  private async processarRecuperacaoSenha(
    destinatario: string,
    nomeCliente: string,
    token: string,
  ): Promise<void> {
    const linkRedefinicao = `${this.frontendUrl}/conta/redefinir-senha?token=${token}`;
    const html = await render(RecuperacaoSenhaEmail({ nomeCliente, linkRedefinicao }));

    await this.emailSender.enviar({
      destinatario,
      assunto: 'Redefina sua senha',
      html,
    });
  }

  private async processarAtivacaoConta(
    destinatario: string,
    nomeCliente: string,
    token: string,
  ): Promise<void> {
    const linkAtivacao = `${this.frontendUrl}/conta/ativar-conta?token=${token}`;
    const html = await render(AtivacaoContaEmail({ nomeCliente, linkAtivacao }));

    await this.emailSender.enviar({
      destinatario,
      assunto: 'Ative sua conta na Atlas Nova Clean',
      html,
    });
  }
}
