import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClienteRepository } from '../../domain/cliente.repository';
import {
  ClienteNaoEncontradoException,
  EmailIgualAoAtualException,
  SenhaAtualIncorretaException,
} from '../../domain/clientes.exceptions';
import { EmailQueuePort } from '../../../emails/domain/email-queue.port';
import { TokenTrocaEmailService } from './token-troca-email.service';

/**
 * Trocar o e-mail da conta exige a senha atual e um clique no link enviado pro e-mail
 * novo. Sem isso, uma sessão aberta bastava pra tomar a conta (a recuperação de senha
 * passaria a ir pro e-mail do invasor) e dava pra "provar" um e-mail alheio, que o
 * checkout usa pra vincular pedidos.
 *
 * De propósito não confere aqui se o e-mail novo já está em uso: responder diferente
 * revelaria quais e-mails têm cadastro. Quem descobre é o dono do endereço, ao clicar
 * no link (ver ConfirmarTrocaEmailUseCase).
 */
@Injectable()
export class SolicitarTrocaEmailUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly tokenTrocaEmail: TokenTrocaEmailService,
    private readonly emailQueue: EmailQueuePort,
  ) {}

  async executar(clienteId: string, novoEmail: string, senhaAtual: string): Promise<void> {
    const cliente = await this.clienteRepository.buscarPorId(clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoException(clienteId);
    }

    if (
      !cliente.possuiSenha() ||
      !(await bcrypt.compare(senhaAtual, cliente.senhaHash as string))
    ) {
      throw new SenhaAtualIncorretaException();
    }

    if (cliente.email?.toLowerCase() === novoEmail) {
      throw new EmailIgualAoAtualException();
    }

    await this.emailQueue.enfileirar({
      tipo: 'CONFIRMACAO_TROCA_EMAIL',
      destinatario: novoEmail,
      nomeCliente: cliente.nome,
      token: await this.tokenTrocaEmail.gerar(cliente, novoEmail),
    });
  }
}
