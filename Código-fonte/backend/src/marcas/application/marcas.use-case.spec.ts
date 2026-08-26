import { Marca } from '../domain/marca.entity';
import { MarcaRepository } from '../domain/marca.repository';
import {
  MarcaComProdutosVinculadosException,
  MarcaDuplicadaException,
  MarcaNaoEncontradaException,
} from '../domain/marcas.exceptions';
import { AtualizarMarcaUseCase } from './atualizar-marca.use-case';
import { CriarMarcaUseCase } from './criar-marca.use-case';
import { ExcluirMarcaUseCase } from './excluir-marca.use-case';
import { ListarMarcasUseCase } from './listar-marcas.use-case';

function criarRepositorioMock(): jest.Mocked<MarcaRepository> {
  return {
    listarTodas: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorNome: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
    possuiProdutosVinculados: jest.fn(),
  } as unknown as jest.Mocked<MarcaRepository>;
}

describe('CriarMarcaUseCase', () => {
  it('cria a marca quando o nome ainda não existe', async () => {
    const marcaRepository = criarRepositorioMock();
    marcaRepository.buscarPorNome.mockResolvedValue(null);
    marcaRepository.criar.mockResolvedValue(new Marca('marca-1', 'Ypê'));

    const useCase = new CriarMarcaUseCase(marcaRepository);
    const resultado = await useCase.executar('Ypê');

    expect(marcaRepository.criar).toHaveBeenCalledWith('Ypê');
    expect(resultado.nome).toBe('Ypê');
  });

  it('lança exceção quando já existe uma marca com o mesmo nome', async () => {
    const marcaRepository = criarRepositorioMock();
    marcaRepository.buscarPorNome.mockResolvedValue(new Marca('marca-1', 'Ypê'));

    const useCase = new CriarMarcaUseCase(marcaRepository);
    await expect(useCase.executar('Ypê')).rejects.toBeInstanceOf(MarcaDuplicadaException);
    expect(marcaRepository.criar).not.toHaveBeenCalled();
  });
});

describe('AtualizarMarcaUseCase', () => {
  it('atualiza o nome quando não conflita com outra marca', async () => {
    const marcaRepository = criarRepositorioMock();
    marcaRepository.buscarPorId.mockResolvedValue(new Marca('marca-1', 'Ype'));
    marcaRepository.buscarPorNome.mockResolvedValue(null);
    marcaRepository.atualizar.mockResolvedValue(new Marca('marca-1', 'Ypê'));

    const useCase = new AtualizarMarcaUseCase(marcaRepository);
    await useCase.executar('marca-1', 'Ypê');

    expect(marcaRepository.atualizar).toHaveBeenCalledWith('marca-1', 'Ypê');
  });

  it('permite manter o próprio nome (não conflita consigo mesma)', async () => {
    const marcaRepository = criarRepositorioMock();
    const marca = new Marca('marca-1', 'Ypê');
    marcaRepository.buscarPorId.mockResolvedValue(marca);
    marcaRepository.buscarPorNome.mockResolvedValue(marca);
    marcaRepository.atualizar.mockResolvedValue(marca);

    const useCase = new AtualizarMarcaUseCase(marcaRepository);
    await expect(useCase.executar('marca-1', 'Ypê')).resolves.toEqual(marca);
  });

  it('lança exceção quando o novo nome já pertence a outra marca', async () => {
    const marcaRepository = criarRepositorioMock();
    marcaRepository.buscarPorId.mockResolvedValue(new Marca('marca-1', 'Ype'));
    marcaRepository.buscarPorNome.mockResolvedValue(new Marca('marca-2', 'Ypê'));

    const useCase = new AtualizarMarcaUseCase(marcaRepository);
    await expect(useCase.executar('marca-1', 'Ypê')).rejects.toBeInstanceOf(
      MarcaDuplicadaException,
    );
  });

  it('lança exceção quando a marca não existe', async () => {
    const marcaRepository = criarRepositorioMock();
    marcaRepository.buscarPorId.mockResolvedValue(null);

    const useCase = new AtualizarMarcaUseCase(marcaRepository);
    await expect(useCase.executar('inexistente', 'Ypê')).rejects.toBeInstanceOf(
      MarcaNaoEncontradaException,
    );
  });
});

describe('ExcluirMarcaUseCase', () => {
  it('exclui a marca quando não há produtos vinculados', async () => {
    const marcaRepository = criarRepositorioMock();
    marcaRepository.buscarPorId.mockResolvedValue(new Marca('marca-1', 'Ypê'));
    marcaRepository.possuiProdutosVinculados.mockResolvedValue(false);

    const useCase = new ExcluirMarcaUseCase(marcaRepository);
    await useCase.executar('marca-1');

    expect(marcaRepository.excluir).toHaveBeenCalledWith('marca-1');
  });

  it('lança exceção e não exclui quando há produtos vinculados', async () => {
    const marcaRepository = criarRepositorioMock();
    marcaRepository.buscarPorId.mockResolvedValue(new Marca('marca-1', 'Ypê'));
    marcaRepository.possuiProdutosVinculados.mockResolvedValue(true);

    const useCase = new ExcluirMarcaUseCase(marcaRepository);
    await expect(useCase.executar('marca-1')).rejects.toBeInstanceOf(
      MarcaComProdutosVinculadosException,
    );
    expect(marcaRepository.excluir).not.toHaveBeenCalled();
  });
});

describe('ListarMarcasUseCase', () => {
  it('devolve todas as marcas do repositório', async () => {
    const marcaRepository = criarRepositorioMock();
    const marcas = [new Marca('marca-1', 'Ypê')];
    marcaRepository.listarTodas.mockResolvedValue(marcas);

    const useCase = new ListarMarcasUseCase(marcaRepository);
    await expect(useCase.executar()).resolves.toEqual(marcas);
  });
});
