import { Categoria } from '../domain/categoria.entity';
import { CategoriaRepository } from '../domain/categoria.repository';
import {
  CategoriaComProdutosVinculadosException,
  CategoriaNaoEncontradaException,
} from '../domain/categorias.exceptions';
import { AtualizarCategoriaUseCase } from './atualizar-categoria.use-case';
import { CriarCategoriaUseCase } from './criar-categoria.use-case';
import { ExcluirCategoriaUseCase } from './excluir-categoria.use-case';
import { ListarCategoriasUseCase } from './listar-categorias.use-case';

function criarRepositorioMock(): jest.Mocked<CategoriaRepository> {
  return {
    listarTodas: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorSlug: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
    possuiProdutosVinculados: jest.fn(),
  } as unknown as jest.Mocked<CategoriaRepository>;
}

describe('CriarCategoriaUseCase', () => {
  it('gera slug único quando o nome já existe em outra categoria', async () => {
    const categoriaRepository = criarRepositorioMock();
    categoriaRepository.buscarPorSlug.mockResolvedValueOnce(
      new Categoria('cat-2', 'limpeza', 'Limpeza'),
    );
    categoriaRepository.buscarPorSlug.mockResolvedValueOnce(null);
    categoriaRepository.criar.mockResolvedValue(new Categoria('cat-3', 'limpeza-2', 'Limpeza'));

    const useCase = new CriarCategoriaUseCase(categoriaRepository);
    const resultado = await useCase.executar('Limpeza');

    expect(categoriaRepository.buscarPorSlug).toHaveBeenNthCalledWith(1, 'limpeza');
    expect(categoriaRepository.criar).toHaveBeenCalledWith({ nome: 'Limpeza', slug: 'limpeza-2' });
    expect(resultado.slug).toBe('limpeza-2');
  });
});

describe('AtualizarCategoriaUseCase', () => {
  it('atualiza o nome sem alterar o slug existente', async () => {
    const categoriaRepository = criarRepositorioMock();
    categoriaRepository.buscarPorId.mockResolvedValue(new Categoria('cat-1', 'limpeza', 'Limpeza'));
    categoriaRepository.atualizar.mockResolvedValue(
      new Categoria('cat-1', 'limpeza', 'Limpeza Doméstica'),
    );

    const useCase = new AtualizarCategoriaUseCase(categoriaRepository);
    await useCase.executar('cat-1', 'Limpeza Doméstica');

    expect(categoriaRepository.atualizar).toHaveBeenCalledWith('cat-1', {
      nome: 'Limpeza Doméstica',
    });
  });

  it('lança exceção quando a categoria não existe', async () => {
    const categoriaRepository = criarRepositorioMock();
    categoriaRepository.buscarPorId.mockResolvedValue(null);

    const useCase = new AtualizarCategoriaUseCase(categoriaRepository);
    await expect(useCase.executar('inexistente', 'Novo nome')).rejects.toBeInstanceOf(
      CategoriaNaoEncontradaException,
    );
  });
});

describe('ExcluirCategoriaUseCase', () => {
  it('exclui a categoria quando não há produtos vinculados', async () => {
    const categoriaRepository = criarRepositorioMock();
    categoriaRepository.buscarPorId.mockResolvedValue(new Categoria('cat-1', 'limpeza', 'Limpeza'));
    categoriaRepository.possuiProdutosVinculados.mockResolvedValue(false);

    const useCase = new ExcluirCategoriaUseCase(categoriaRepository);
    await useCase.executar('cat-1');

    expect(categoriaRepository.excluir).toHaveBeenCalledWith('cat-1');
  });

  it('lança exceção e não exclui quando há produtos vinculados', async () => {
    const categoriaRepository = criarRepositorioMock();
    categoriaRepository.buscarPorId.mockResolvedValue(new Categoria('cat-1', 'limpeza', 'Limpeza'));
    categoriaRepository.possuiProdutosVinculados.mockResolvedValue(true);

    const useCase = new ExcluirCategoriaUseCase(categoriaRepository);
    await expect(useCase.executar('cat-1')).rejects.toBeInstanceOf(
      CategoriaComProdutosVinculadosException,
    );
    expect(categoriaRepository.excluir).not.toHaveBeenCalled();
  });
});

describe('ListarCategoriasUseCase', () => {
  it('devolve todas as categorias do repositório', async () => {
    const categoriaRepository = criarRepositorioMock();
    const categorias = [new Categoria('cat-1', 'limpeza', 'Limpeza')];
    categoriaRepository.listarTodas.mockResolvedValue(categorias);

    const useCase = new ListarCategoriasUseCase(categoriaRepository);
    const resultado = await useCase.executar();

    expect(resultado).toEqual(categorias);
  });
});
