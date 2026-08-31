import { Injectable } from '@nestjs/common';
import { Cupom } from '../domain/cupom.entity';
import { CupomRepository, DadosCriacaoCupom } from '../domain/cupom.repository';
import { CupomCodigoDuplicadoException } from '../domain/cupons.exceptions';

@Injectable()
export class CriarCupomUseCase {
  constructor(private readonly cupomRepository: CupomRepository) {}

  async executar(dados: DadosCriacaoCupom): Promise<Cupom> {
    // Normaliza pra maiúsculo — cupom é digitado pelo cliente no checkout, evita
    // "BEMVINDO10" vs "bemvindo10" virarem códigos diferentes por acidente.
    const codigo = dados.codigo.toUpperCase();

    if (await this.cupomRepository.buscarPorCodigo(codigo)) {
      throw new CupomCodigoDuplicadoException(codigo);
    }

    return this.cupomRepository.criar({ ...dados, codigo });
  }
}
