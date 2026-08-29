import { Cliente } from '../domain/cliente.entity';
import { ClienteRepository } from '../domain/cliente.repository';
import {
  ClienteNaoEncontradoException,
  DocumentoInvalidoException,
} from '../domain/clientes.exceptions';
import { CriarClienteUseCase } from './criar-cliente.use-case';
import { AtualizarClienteUseCase } from './atualizar-cliente.use-case';
import { BuscarClientePorIdUseCase } from './buscar-cliente-por-id.use-case';

const CPF_VALIDO = '111.444.777-35';
const CNPJ_VALIDO = '11.222.333/0001-81';

function criarClienteMock(): jest.Mocked<ClienteRepository> {
  return {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    listarTodos: jest.fn(),
  } as unknown as jest.Mocked<ClienteRepository>;
}

describe('CriarClienteUseCase', () => {
  let clienteRepository: jest.Mocked<ClienteRepository>;
  let useCase: CriarClienteUseCase;

  beforeEach(() => {
    clienteRepository = criarClienteMock();
    useCase = new CriarClienteUseCase(clienteRepository);
  });

  it('cria cliente pessoa física com CPF válido', async () => {
    clienteRepository.criar.mockResolvedValue(
      new Cliente('cli-1', 'Maria', undefined, undefined, CPF_VALIDO),
    );

    await useCase.executar({ nome: 'Maria', cpf: CPF_VALIDO });

    expect(clienteRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Maria', cpf: CPF_VALIDO }),
    );
  });

  it('cria cliente pessoa jurídica (B2B) com CNPJ válido', async () => {
    clienteRepository.criar.mockResolvedValue(
      new Cliente('cli-2', 'Escritório XYZ', undefined, undefined, undefined, CNPJ_VALIDO),
    );

    await useCase.executar({ nome: 'Escritório XYZ', cnpj: CNPJ_VALIDO });

    expect(clienteRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ cnpj: CNPJ_VALIDO }),
    );
  });

  it('rejeita CPF com dígito verificador inválido', async () => {
    await expect(useCase.executar({ nome: 'Maria', cpf: '11144477736' })).rejects.toBeInstanceOf(
      DocumentoInvalidoException,
    );
    expect(clienteRepository.criar).not.toHaveBeenCalled();
  });

  it('rejeita CNPJ inválido', async () => {
    await expect(
      useCase.executar({ nome: 'Escritório', cnpj: '11222333000182' }),
    ).rejects.toBeInstanceOf(DocumentoInvalidoException);
  });

  it('rejeita CPF e CNPJ informados ao mesmo tempo', async () => {
    await expect(
      useCase.executar({ nome: 'Maria', cpf: CPF_VALIDO, cnpj: CNPJ_VALIDO }),
    ).rejects.toBeInstanceOf(DocumentoInvalidoException);
  });

  it('permite cliente sem nenhum documento (cadastro mínimo)', async () => {
    clienteRepository.criar.mockResolvedValue(new Cliente('cli-3', 'Convidado'));

    await useCase.executar({ nome: 'Convidado' });

    expect(clienteRepository.criar).toHaveBeenCalled();
  });
});

describe('AtualizarClienteUseCase', () => {
  let clienteRepository: jest.Mocked<ClienteRepository>;
  let useCase: AtualizarClienteUseCase;

  beforeEach(() => {
    clienteRepository = criarClienteMock();
    useCase = new AtualizarClienteUseCase(clienteRepository);
  });

  it('lança ClienteNaoEncontradoException quando o cliente não existe', async () => {
    clienteRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.executar('inexistente', { nome: 'X' })).rejects.toBeInstanceOf(
      ClienteNaoEncontradoException,
    );
  });

  it('revalida documento contra o valor já salvo quando só um dos dois é enviado', async () => {
    clienteRepository.buscarPorId.mockResolvedValue(
      new Cliente('cli-1', 'Maria', undefined, undefined, undefined, CNPJ_VALIDO),
    );

    // Envia CPF sem remover o CNPJ existente — violaria a exclusividade.
    await expect(useCase.executar('cli-1', { cpf: CPF_VALIDO })).rejects.toBeInstanceOf(
      DocumentoInvalidoException,
    );
  });

  it('atualiza normalmente quando o documento informado é válido e consistente', async () => {
    clienteRepository.buscarPorId.mockResolvedValue(new Cliente('cli-1', 'Maria'));
    clienteRepository.atualizar.mockResolvedValue(
      new Cliente('cli-1', 'Maria Silva', undefined, undefined, CPF_VALIDO),
    );

    await useCase.executar('cli-1', { nome: 'Maria Silva', cpf: CPF_VALIDO });

    expect(clienteRepository.atualizar).toHaveBeenCalledWith('cli-1', {
      nome: 'Maria Silva',
      cpf: CPF_VALIDO,
    });
  });
});

describe('BuscarClientePorIdUseCase', () => {
  it('lança ClienteNaoEncontradoException quando não existe', async () => {
    const clienteRepository = criarClienteMock();
    clienteRepository.buscarPorId.mockResolvedValue(null);
    const useCase = new BuscarClientePorIdUseCase(clienteRepository);

    await expect(useCase.executar('inexistente')).rejects.toBeInstanceOf(
      ClienteNaoEncontradoException,
    );
  });
});
