import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { apenasDigitosCep } from '../../../shared/cep.util';
import { CepLookupProvider, EnderecoPorCep } from '../../domain/cep-lookup.port';
import { CepInvalidoException, CepNaoEncontradoException } from '../../domain/clientes.exceptions';

const VIA_CEP_URL = 'https://viacep.com.br/ws';

interface RespostaViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/** Implementação concreta de CepLookupProvider via ViaCEP (sem chave de API). */
@Injectable()
export class ViaCepAdapter extends CepLookupProvider {
  private readonly http: AxiosInstance;

  constructor() {
    super();
    this.http = axios.create({ baseURL: VIA_CEP_URL, timeout: 5_000 });
  }

  async buscar(cep: string): Promise<EnderecoPorCep> {
    const cepLimpo = apenasDigitosCep(cep);

    let resposta;
    try {
      resposta = await this.http.get<RespostaViaCep>(`/${cepLimpo}/json/`);
    } catch {
      // ViaCEP responde 400 pra CEP com formato claramente inválido (ex.: menos de 8 dígitos).
      throw new CepInvalidoException(cep);
    }

    // CEP com 8 dígitos válidos mas que não existe na base do ViaCEP responde 200
    // com { erro: true } — não é o mesmo caso de formato inválido.
    if (resposta.data.erro) {
      throw new CepNaoEncontradoException(cep);
    }

    return {
      cep: resposta.data.cep,
      logradouro: resposta.data.logradouro,
      bairro: resposta.data.bairro,
      cidade: resposta.data.localidade,
      estado: resposta.data.uf,
    };
  }
}
