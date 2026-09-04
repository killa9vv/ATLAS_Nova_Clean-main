import { Injectable } from '@nestjs/common';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { CarrinhoSessao } from '../domain/carrinho-sessao';
import { gerarTokenOpaco } from '../../shared/token.util';

const TTL_CARRINHO_DIAS = 30;

export interface ResultadoResolucaoCarrinho {
  carrinho: CarrinhoSessao | undefined;
  /** Preenchido só quando um sessionToken novo foi gerado (carrinho recém-criado) —
   * é isso que o controller usa pra decidir se devolve um token novo pro cliente. */
  sessionTokenNovo: string | undefined;
}

function calcularExpiracao(): Date {
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + TTL_CARRINHO_DIAS);
  return expiraEm;
}

/**
 * Resolve qual carrinho persistido corresponde a esta requisição — por cliente
 * logado (prioridade) ou por sessionToken anônimo — e opcionalmente cria um novo
 * quando nada é encontrado. Também aplica a "adoção": quando um cliente loga e tem
 * um sessionToken de carrinho anônimo válido, e ainda não tem carrinho próprio, esse
 * carrinho anônimo passa a ser dele — sem fundir com um carrinho que já existisse.
 */
@Injectable()
export class ResolverCarrinhoSessaoUseCase {
  constructor(private readonly carrinhoSessaoRepository: CarrinhoSessaoRepository) {}

  async executar(
    sessionToken: string | undefined,
    clienteId: string | undefined,
    criarSeNaoExistir: boolean,
  ): Promise<ResultadoResolucaoCarrinho> {
    if (clienteId) {
      const carrinhoDoCliente = await this.carrinhoSessaoRepository.buscarPorClienteId(clienteId);
      if (carrinhoDoCliente) {
        return { carrinho: carrinhoDoCliente, sessionTokenNovo: undefined };
      }
    }

    if (sessionToken) {
      const carrinhoAnonimo =
        await this.carrinhoSessaoRepository.buscarPorSessionToken(sessionToken);
      if (carrinhoAnonimo) {
        if (clienteId && !carrinhoAnonimo.clienteId) {
          await this.carrinhoSessaoRepository.adotarPorCliente(carrinhoAnonimo.id, clienteId);
        }
        return { carrinho: carrinhoAnonimo, sessionTokenNovo: undefined };
      }
    }

    if (!criarSeNaoExistir) {
      return { carrinho: undefined, sessionTokenNovo: undefined };
    }

    // Nunca reaproveita um sessionToken recebido mas não encontrado no banco — pode
    // ter expirado/sido limpo, ou colidir com uma criação concorrente da mesma
    // requisição em outra aba. Sempre gera um valor novo pra criar.
    const novoToken = gerarTokenOpaco().valor;
    const carrinhoCriado = await this.carrinhoSessaoRepository.criar(
      novoToken,
      clienteId,
      calcularExpiracao(),
    );
    return { carrinho: carrinhoCriado, sessionTokenNovo: novoToken };
  }
}

export { TTL_CARRINHO_DIAS, calcularExpiracao };
