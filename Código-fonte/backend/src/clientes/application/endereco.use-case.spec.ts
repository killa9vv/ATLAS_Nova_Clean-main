import { Cliente } from '../domain/cliente.entity';
import { ClienteRepository } from '../domain/cliente.repository';
import { Endereco } from '../domain/endereco.entity';
import { EnderecoRepository } from '../domain/endereco.repository';
import { CepLookupProvider } from '../domain/cep-lookup.port';
import {
  CepInvalidoException,
  ClienteNaoEncontradoException,
  EnderecoNaoEncontradoException,
} from '../domain/clientes.exceptions';
import { CriarEnderecoUseCase } from './criar-endereco.use-case';
import { AtualizarEnderecoUseCase } from './atualizar-endereco.use-case';
import { ExcluirEnderecoUseCase } from './excluir-endereco.use-case';
import { DefinirEnderecoPadraoUseCase } from './definir-endereco-padrao.use-case';
import { BuscarEnderecoPorCepUseCase } from './buscar-endereco-por-cep.use-case';

function criarEnderecoRepositoryMock(): jest.Mocked<EnderecoRepository> {
  return {
    criar: jest.fn(),
    listarPorCliente: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
    definirComoPadrao: jest.fn(),
  } as unknown as jest.Mocked<EnderecoRepository>;
}

function criarEndereco(overrides: Partial<Endereco> = {}): Endereco {
  return new Endereco(
    overrides.id ?? 'end-1',
    overrides.clienteId ?? 'cli-1',
    overrides.cep ?? '28013000',
    overrides.logradouro ?? 'Rua do Sol',
    overrides.numero ?? '123',
    overrides.bairro ?? 'Centro',
    overrides.cidade ?? 'Campos dos Goytacazes',
    overrides.estado ?? 'RJ',
    overrides.padrao ?? false,
  );
}

const ENDERECO_INPUT_BASE = {
  clienteId: 'cli-1',
  cep: '28013000',
  logradouro: 'Rua do Sol',
  numero: '123',
  bairro: 'Centro',
  cidade: 'Campos dos Goytacazes',
  estado: 'RJ',
};

describe('CriarEnderecoUseCase', () => {
  let enderecoRepository: jest.Mocked<EnderecoRepository>;
  let clienteRepository: jest.Mocked<ClienteRepository>;
  let useCase: CriarEnderecoUseCase;

  beforeEach(() => {
    enderecoRepository = criarEnderecoRepositoryMock();
    clienteRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue(new Cliente('cli-1', 'Maria')),
      atualizar: jest.fn(),
      listarTodos: jest.fn(),
    } as unknown as jest.Mocked<ClienteRepository>;
    useCase = new CriarEnderecoUseCase(enderecoRepository, clienteRepository);
  });

  it('rejeita CEP com formato inválido', async () => {
    await expect(useCase.executar({ ...ENDERECO_INPUT_BASE, cep: '123' })).rejects.toBeInstanceOf(
      CepInvalidoException,
    );
    expect(enderecoRepository.criar).not.toHaveBeenCalled();
  });

  it('lança ClienteNaoEncontradoException quando o cliente não existe', async () => {
    clienteRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.executar(ENDERECO_INPUT_BASE)).rejects.toBeInstanceOf(
      ClienteNaoEncontradoException,
    );
  });

  it('o primeiro endereço do cliente nasce como padrão automaticamente', async () => {
    enderecoRepository.listarPorCliente.mockResolvedValue([]);
    enderecoRepository.criar.mockResolvedValue(criarEndereco({ padrao: true }));

    await useCase.executar(ENDERECO_INPUT_BASE);

    expect(enderecoRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ padrao: true }),
    );
  });

  it('o segundo endereço em diante não nasce como padrão', async () => {
    enderecoRepository.listarPorCliente.mockResolvedValue([criarEndereco({ padrao: true })]);
    enderecoRepository.criar.mockResolvedValue(criarEndereco({ id: 'end-2', padrao: false }));

    await useCase.executar(ENDERECO_INPUT_BASE);

    expect(enderecoRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ padrao: false }),
    );
  });
});

describe('AtualizarEnderecoUseCase', () => {
  let enderecoRepository: jest.Mocked<EnderecoRepository>;
  let useCase: AtualizarEnderecoUseCase;

  beforeEach(() => {
    enderecoRepository = criarEnderecoRepositoryMock();
    useCase = new AtualizarEnderecoUseCase(enderecoRepository);
  });

  it('lança EnderecoNaoEncontradoException quando o endereço não pertence ao cliente informado', async () => {
    enderecoRepository.buscarPorId.mockResolvedValue(criarEndereco({ clienteId: 'outro-cliente' }));

    await expect(useCase.executar('end-1', 'cli-1', { numero: '456' })).rejects.toBeInstanceOf(
      EnderecoNaoEncontradoException,
    );
    expect(enderecoRepository.atualizar).not.toHaveBeenCalled();
  });

  it('rejeita CEP em formato inválido na atualização', async () => {
    enderecoRepository.buscarPorId.mockResolvedValue(criarEndereco());

    await expect(useCase.executar('end-1', 'cli-1', { cep: 'abc' })).rejects.toBeInstanceOf(
      CepInvalidoException,
    );
  });

  it('atualiza quando o endereço pertence ao cliente', async () => {
    enderecoRepository.buscarPorId.mockResolvedValue(criarEndereco());
    enderecoRepository.atualizar.mockResolvedValue(criarEndereco({ numero: '456' }));

    await useCase.executar('end-1', 'cli-1', { numero: '456' });

    expect(enderecoRepository.atualizar).toHaveBeenCalledWith('end-1', { numero: '456' });
  });
});

describe('ExcluirEnderecoUseCase', () => {
  it('não exclui endereço de outro cliente', async () => {
    const enderecoRepository = criarEnderecoRepositoryMock();
    enderecoRepository.buscarPorId.mockResolvedValue(criarEndereco({ clienteId: 'outro-cliente' }));
    const useCase = new ExcluirEnderecoUseCase(enderecoRepository);

    await expect(useCase.executar('end-1', 'cli-1')).rejects.toBeInstanceOf(
      EnderecoNaoEncontradoException,
    );
    expect(enderecoRepository.excluir).not.toHaveBeenCalled();
  });
});

describe('DefinirEnderecoPadraoUseCase', () => {
  it('não permite marcar como padrão um endereço de outro cliente', async () => {
    const enderecoRepository = criarEnderecoRepositoryMock();
    enderecoRepository.buscarPorId.mockResolvedValue(criarEndereco({ clienteId: 'outro-cliente' }));
    const useCase = new DefinirEnderecoPadraoUseCase(enderecoRepository);

    await expect(useCase.executar('end-1', 'cli-1')).rejects.toBeInstanceOf(
      EnderecoNaoEncontradoException,
    );
    expect(enderecoRepository.definirComoPadrao).not.toHaveBeenCalled();
  });

  it('delega ao repositório, que desmarca o padrão anterior atomicamente', async () => {
    const enderecoRepository = criarEnderecoRepositoryMock();
    enderecoRepository.buscarPorId.mockResolvedValue(criarEndereco({ padrao: false }));
    enderecoRepository.definirComoPadrao.mockResolvedValue(criarEndereco({ padrao: true }));
    const useCase = new DefinirEnderecoPadraoUseCase(enderecoRepository);

    const resultado = await useCase.executar('end-1', 'cli-1');

    expect(enderecoRepository.definirComoPadrao).toHaveBeenCalledWith('end-1', 'cli-1');
    expect(resultado.padrao).toBe(true);
  });
});

describe('BuscarEnderecoPorCepUseCase', () => {
  it('lança CepInvalidoException sem chamar o provedor quando o formato já é inválido', async () => {
    const cepLookupProvider = { buscar: jest.fn() } as unknown as jest.Mocked<CepLookupProvider>;
    const useCase = new BuscarEnderecoPorCepUseCase(cepLookupProvider);

    await expect(useCase.executar('123')).rejects.toBeInstanceOf(CepInvalidoException);
    expect(cepLookupProvider.buscar).not.toHaveBeenCalled();
  });

  it('delega ao provedor quando o formato é válido', async () => {
    const cepLookupProvider = {
      buscar: jest.fn().mockResolvedValue({
        cep: '28013-000',
        logradouro: 'Rua do Sol',
        bairro: 'Centro',
        cidade: 'Campos dos Goytacazes',
        estado: 'RJ',
      }),
    } as unknown as jest.Mocked<CepLookupProvider>;
    const useCase = new BuscarEnderecoPorCepUseCase(cepLookupProvider);

    const resultado = await useCase.executar('28013000');

    expect(cepLookupProvider.buscar).toHaveBeenCalledWith('28013000');
    expect(resultado.cidade).toBe('Campos dos Goytacazes');
  });
});
