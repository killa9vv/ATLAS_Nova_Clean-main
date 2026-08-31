import { Injectable } from '@nestjs/common';
import { Cupom } from '../domain/cupom.entity';
import { CupomRepository, DadosAtualizacaoCupom } from '../domain/cupom.repository';
import { CupomNaoEncontradoException } from '../domain/cupons.exceptions';

/** Não permite editar `codigo` de propósito — trocar o código de um cupom já
 * divulgado quebraria links/mensagens que já saíram com o código antigo. Pra
 * "trocar o código", cria um cupom novo e desativa o antigo. */
@Injectable()
export class AtualizarCupomUseCase {
  constructor(private readonly cupomRepository: CupomRepository) {}

  async executar(id: string, dados: DadosAtualizacaoCupom): Promise<Cupom> {
    const existente = await this.cupomRepository.buscarPorId(id);
    if (!existente) {
      throw new CupomNaoEncontradoException(id);
    }

    return this.cupomRepository.atualizar(id, dados);
  }
}
