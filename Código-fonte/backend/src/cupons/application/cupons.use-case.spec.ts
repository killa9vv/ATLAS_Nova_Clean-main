import { Cupom } from '../domain/cupom.entity';
import { CupomRepository } from '../domain/cupom.repository';
import {
  CupomCodigoDuplicadoException,
  CupomNaoEncontradoException,
} from '../domain/cupons.exceptions';
import { AtualizarCupomUseCase } from './atualizar-cupom.use-case';
import { CriarCupomUseCase } from './criar-cupom.use-case';
import { ListarCuponsUseCase } from './listar-cupons.use-case';

function criarRepositorioMock(): jest.Mocked<CupomRepository> {
  return {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorCodigo: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
  } as unknown as jest.Mocked<CupomRepository>;
}

function criarCupom(): Cupom {
  return new Cupom(
    'cupom-1',
    'BEMVINDO10',
    'PERCENTUAL',
    10,
    true,
    0,
    new Date('2026-01-01T00:00:00.000Z'),
    undefined,
    undefined,
  );
}

describe('CriarCupomUseCase', () => {
  it('cria o cupom normalizando o código para maiúsculo', async () => {
    const cupomRepository = criarRepositorioMock();
    cupomRepository.buscarPorCodigo.mockResolvedValue(null);
    cupomRepository.criar.mockResolvedValue(criarCupom());

    const useCase = new CriarCupomUseCase(cupomRepository);
    await useCase.executar({ codigo: 'bemvindo10', tipoDesconto: 'PERCENTUAL', valor: 10 });

    expect(cupomRepository.buscarPorCodigo).toHaveBeenCalledWith('BEMVINDO10');
    expect(cupomRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'BEMVINDO10' }),
    );
  });

  it('lança exceção quando o código já existe', async () => {
    const cupomRepository = criarRepositorioMock();
    cupomRepository.buscarPorCodigo.mockResolvedValue(criarCupom());

    const useCase = new CriarCupomUseCase(cupomRepository);
    await expect(
      useCase.executar({ codigo: 'BEMVINDO10', tipoDesconto: 'PERCENTUAL', valor: 10 }),
    ).rejects.toBeInstanceOf(CupomCodigoDuplicadoException);
    expect(cupomRepository.criar).not.toHaveBeenCalled();
  });
});

describe('AtualizarCupomUseCase', () => {
  it('atualiza o cupom existente', async () => {
    const cupomRepository = criarRepositorioMock();
    cupomRepository.buscarPorId.mockResolvedValue(criarCupom());
    cupomRepository.atualizar.mockResolvedValue(criarCupom());

    const useCase = new AtualizarCupomUseCase(cupomRepository);
    await useCase.executar('cupom-1', { ativo: false });

    expect(cupomRepository.atualizar).toHaveBeenCalledWith('cupom-1', { ativo: false });
  });

  it('lança exceção quando o cupom não existe', async () => {
    const cupomRepository = criarRepositorioMock();
    cupomRepository.buscarPorId.mockResolvedValue(null);

    const useCase = new AtualizarCupomUseCase(cupomRepository);
    await expect(useCase.executar('inexistente', { ativo: false })).rejects.toBeInstanceOf(
      CupomNaoEncontradoException,
    );
    expect(cupomRepository.atualizar).not.toHaveBeenCalled();
  });
});

describe('ListarCuponsUseCase', () => {
  it('devolve todos os cupons do repositório', async () => {
    const cupomRepository = criarRepositorioMock();
    const cupons = [criarCupom()];
    cupomRepository.listarTodos.mockResolvedValue(cupons);

    const useCase = new ListarCuponsUseCase(cupomRepository);
    await expect(useCase.executar()).resolves.toEqual(cupons);
  });
});
