export interface EnderecoPorCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/**
 * Porta para autocomplete de endereço a partir do CEP (hoje implementada pelo
 * ViaCEP — ver infrastructure/gateways/via-cep.adapter.ts). O domínio/aplicação não
 * conhece o provedor concreto.
 */
export abstract class CepLookupProvider {
  abstract buscar(cep: string): Promise<EnderecoPorCep>;
}
