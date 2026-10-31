import { Injectable } from '@nestjs/common';
import { ClienteRepository } from '../../domain/cliente.repository';
import { TokenRecuperacaoSenhaRepository } from '../../domain/token-recuperacao-senha.repository';
import { EmailJaCadastradoException } from '../../domain/clientes.exceptions';
import { EmailQueuePort } from '../../../emails/domain/email-queue.port';
import { gerarTokenOpaco } from '../../../shared/token.util';

const EXPIRACAO_TOKEN_HORAS = 24;

export interface SolicitarCriacaoContaInput {
  nome: string;
  email: string;
  telefone?: string;
}

/**
 * "Criar conta" nunca define senha direto: só manda um link pro e-mail, e a senha é
 * escolhida na página do link (POST /auth/clientes/redefinir-senha, mesmo token da
 * recuperação de senha). Ter a senha definida = ter provado acesso ao e-mail.
 *
 * Sem isso, qualquer um podia "criar conta" com o e-mail de um cliente que só
 * comprou como convidado (Cliente sem senha) e passar a ver os pedidos dele — ou
 * criar conta com o e-mail de outra pessoa e receber os pedidos que ela fizesse
 * depois marcando "salvar meus dados" (o checkout vincula por e-mail).
 */
@Injectable()
export class SolicitarCriacaoContaUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly tokenRepository: TokenRecuperacaoSenhaRepository,
    private readonly emailQueue: EmailQueuePort,
  ) {}

  async executar(input: SolicitarCriacaoContaInput): Promise<void> {
    const existente = await this.clienteRepository.buscarPorEmail(input.email);
    if (existente?.possuiSenha()) {
      throw new EmailJaCadastradoException();
    }

    // Convidado já existente: mantém nome/telefone do cadastro (quem pediu ainda não
    // provou ser o dono do e-mail, então não pode alterar nada até ativar).
    const cliente =
      existente ??
      (await this.clienteRepository.criar({
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
      }));

    await this.tokenRepository.invalidarValidosDoCliente(cliente.id);

    const { valor, hash } = gerarTokenOpaco();
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + EXPIRACAO_TOKEN_HORAS);
    await this.tokenRepository.criar({ clienteId: cliente.id, tokenHash: hash, expiraEm });

    await this.emailQueue.enfileirar({
      tipo: 'ATIVACAO_CONTA',
      destinatario: input.email,
      nomeCliente: cliente.nome,
      token: valor,
    });
  }
}
