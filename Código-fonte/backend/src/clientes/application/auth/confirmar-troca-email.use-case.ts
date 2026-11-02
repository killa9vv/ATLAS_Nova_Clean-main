import { Injectable } from '@nestjs/common';
import { ClienteRepository } from '../../domain/cliente.repository';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { EmailJaCadastradoException } from '../../domain/clientes.exceptions';
import { EmailQueuePort } from '../../../emails/domain/email-queue.port';
import { TokenTrocaEmailService } from './token-troca-email.service';

/** Destino do link enviado por SolicitarTrocaEmailUseCase. */
@Injectable()
export class ConfirmarTrocaEmailUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenTrocaEmail: TokenTrocaEmailService,
    private readonly emailQueue: EmailQueuePort,
  ) {}

  async executar(token: string): Promise<void> {
    const payload = await this.tokenTrocaEmail.ler(token);
    const cliente = await this.clienteRepository.buscarPorId(payload.sub);
    this.tokenTrocaEmail.garantirVigente(payload, cliente);

    const emUso = await this.clienteRepository.buscarPorEmail(payload.novoEmail);
    if (emUso && emUso.id !== cliente.id) {
      throw new EmailJaCadastradoException();
    }

    await this.clienteRepository.atualizar(cliente.id, { email: payload.novoEmail });
    // Mesmo motivo de RedefinirSenhaUseCase: mudar a credencial derruba as sessões.
    await this.refreshTokenRepository.revogarTodosDoCliente(cliente.id);

    // Aviso pro endereço antigo: se a troca não foi do dono, é a única chance dele saber.
    if (payload.emailAtual) {
      await this.emailQueue.enfileirar({
        tipo: 'AVISO_EMAIL_ALTERADO',
        destinatario: payload.emailAtual,
        nomeCliente: cliente.nome,
        novoEmail: payload.novoEmail,
      });
    }
  }
}
