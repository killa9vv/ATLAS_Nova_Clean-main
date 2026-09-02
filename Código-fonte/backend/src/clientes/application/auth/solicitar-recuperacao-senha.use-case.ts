import { Injectable, Logger } from '@nestjs/common';
import { ClienteRepository } from '../../domain/cliente.repository';
import { TokenRecuperacaoSenhaRepository } from '../../domain/token-recuperacao-senha.repository';
import { gerarTokenOpaco } from '../../../shared/token.util';

const EXPIRACAO_TOKEN_MINUTOS = 60;

@Injectable()
export class SolicitarRecuperacaoSenhaUseCase {
  private readonly logger = new Logger(SolicitarRecuperacaoSenhaUseCase.name);

  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly tokenRepository: TokenRecuperacaoSenhaRepository,
  ) {}

  // Sempre "sucede" do ponto de vista do chamador (controller devolve 200 mesmo se
  // o e-mail não existir) — não revela se um e-mail está cadastrado. Quando o
  // cliente existe, devolve o token pra quem chamou (hoje: o controller loga e
  // devolve na resposta, já que não existe envio de e-mail configurado no projeto —
  // TODO: trocar por envio real assim que um provedor for configurado, e então
  // parar de devolver o token na resposta HTTP).
  async executar(email: string): Promise<string | null> {
    const cliente = await this.clienteRepository.buscarPorEmail(email);
    if (!cliente || !cliente.possuiSenha()) {
      // Cliente inexistente ou sem conta (só checkout de convidado) — mesmo
      // resultado "silencioso" nos dois casos.
      return null;
    }

    await this.tokenRepository.invalidarValidosDoCliente(cliente.id);

    const { valor, hash } = gerarTokenOpaco();
    const expiraEm = new Date();
    expiraEm.setMinutes(expiraEm.getMinutes() + EXPIRACAO_TOKEN_MINUTOS);
    await this.tokenRepository.criar({ clienteId: cliente.id, tokenHash: hash, expiraEm });

    this.logger.warn(
      `Token de recuperação pra ${cliente.email} (sem envio de e-mail configurado — não usar em produção): ${valor}`,
    );
    return valor;
  }
}
