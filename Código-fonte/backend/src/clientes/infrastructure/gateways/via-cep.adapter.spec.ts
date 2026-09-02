import axios from 'axios';
import { ViaCepAdapter } from './via-cep.adapter';
import {
  CepIndisponivelException,
  CepInvalidoException,
  CepNaoEncontradoException,
} from '../../domain/clientes.exceptions';

jest.mock('axios');

const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ViaCepAdapter', () => {
  let httpMock: { get: jest.Mock };
  let adapter: ViaCepAdapter;

  beforeEach(() => {
    httpMock = { get: jest.fn() };
    axiosMock.create.mockReturnValue(httpMock as any);
    axiosMock.isAxiosError.mockImplementation((erro: any) => Boolean(erro?.isAxiosError));
    adapter = new ViaCepAdapter();
  });

  afterEach(() => jest.resetAllMocks());

  it('retorna o endereço quando o ViaCEP encontra o CEP', async () => {
    httpMock.get.mockResolvedValue({
      data: {
        cep: '28013-000',
        logradouro: 'Rua do Sol',
        bairro: 'Centro',
        localidade: 'Campos dos Goytacazes',
        uf: 'RJ',
      },
    });

    const resultado = await adapter.buscar('28013000');

    expect(httpMock.get).toHaveBeenCalledWith('/28013000/json/');
    expect(resultado).toEqual({
      cep: '28013-000',
      logradouro: 'Rua do Sol',
      bairro: 'Centro',
      cidade: 'Campos dos Goytacazes',
      estado: 'RJ',
    });
  });

  it('lança CepNaoEncontradoException quando o ViaCEP responde { erro: true }', async () => {
    httpMock.get.mockResolvedValue({ data: { erro: true } });

    await expect(adapter.buscar('99999999')).rejects.toBeInstanceOf(CepNaoEncontradoException);
  });

  it('lança CepInvalidoException quando a chamada falha (formato rejeitado pelo ViaCEP)', async () => {
    httpMock.get.mockRejectedValue({ isAxiosError: true, response: { status: 400 } });

    await expect(adapter.buscar('123')).rejects.toBeInstanceOf(CepInvalidoException);
  });

  it('lança CepIndisponivelException quando a chamada falha por timeout/erro de rede', async () => {
    httpMock.get.mockRejectedValue({ isAxiosError: true, code: 'ECONNABORTED' });

    await expect(adapter.buscar('28013000')).rejects.toBeInstanceOf(CepIndisponivelException);
  });

  it('lança CepIndisponivelException quando o ViaCEP responde 5xx', async () => {
    httpMock.get.mockRejectedValue({ isAxiosError: true, response: { status: 503 } });

    await expect(adapter.buscar('28013000')).rejects.toBeInstanceOf(CepIndisponivelException);
  });
});
