import { Resenha } from '../domain/resenha.entity';
import { ResenhaRepository } from '../domain/resenha.repository';
import { CriarResenhaUseCase } from './criar-resenha.use-case';
import { ListarResenhasUseCase } from './listar-resenhas.use-case';

function criarRepositorioMock(): jest.Mocked<ResenhaRepository> {
  return {
    listarTodas: jest.fn(),
    criar: jest.fn(),
  } as unknown as jest.Mocked<ResenhaRepository>;
}

function criarResenha(): Resenha {
  return new Resenha('resenha-1', 'Maria da Silva', 5, 'Muito bom!', new Date('2026-01-01'));
}

describe('CriarResenhaUseCase', () => {
  it('cria a resenha delegando ao repositório', async () => {
    const resenhaRepository = criarRepositorioMock();
    resenhaRepository.criar.mockResolvedValue(criarResenha());

    const useCase = new CriarResenhaUseCase(resenhaRepository);
    await useCase.executar({ nome: 'Maria da Silva', nota: 5, comentario: 'Muito bom!' });

    expect(resenhaRepository.criar).toHaveBeenCalledWith({
      nome: 'Maria da Silva',
      nota: 5,
      comentario: 'Muito bom!',
    });
  });
});

describe('ListarResenhasUseCase', () => {
  it('devolve todas as resenhas do repositório', async () => {
    const resenhaRepository = criarRepositorioMock();
    const resenhas = [criarResenha()];
    resenhaRepository.listarTodas.mockResolvedValue(resenhas);

    const useCase = new ListarResenhasUseCase(resenhaRepository);
    await expect(useCase.executar()).resolves.toEqual(resenhas);
  });
});
