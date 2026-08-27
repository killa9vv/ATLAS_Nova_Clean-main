import { Injectable } from '@nestjs/common';
import { formatoCepValido } from '../../shared/cep.util';
import { CepLookupProvider, EnderecoPorCep } from '../domain/cep-lookup.port';
import { CepInvalidoException } from '../domain/clientes.exceptions';

/** Autocomplete de endereço a partir do CEP (logradouro/bairro/cidade/UF), usado no formulário de endereço. */
@Injectable()
export class BuscarEnderecoPorCepUseCase {
  constructor(private readonly cepLookupProvider: CepLookupProvider) {}

  async executar(cep: string): Promise<EnderecoPorCep> {
    if (!formatoCepValido(cep)) {
      throw new CepInvalidoException(cep);
    }
    return this.cepLookupProvider.buscar(cep);
  }
}
