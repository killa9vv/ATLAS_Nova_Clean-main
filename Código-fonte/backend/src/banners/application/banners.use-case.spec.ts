import { Banner } from '../domain/banner.entity';
import { BannerRepository } from '../domain/banner.repository';
import { BannerNaoEncontradoException } from '../domain/banners.exceptions';
import { AtualizarBannerUseCase } from './atualizar-banner.use-case';
import { CriarBannerUseCase } from './criar-banner.use-case';
import { ExcluirBannerUseCase } from './excluir-banner.use-case';
import { ListarBannersUseCase } from './listar-banners.use-case';

function criarRepositorioMock(): jest.Mocked<BannerRepository> {
  return {
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn(),
  } as unknown as jest.Mocked<BannerRepository>;
}

function criarBanner(): Banner {
  return new Banner(
    'banner-1',
    'Promoção de inverno',
    0,
    true,
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    'https://res.cloudinary.com/atlas/banner1.jpg',
    'https://atlasnova.com/produtos',
  );
}

describe('CriarBannerUseCase', () => {
  it('cria o banner delegando ao repositório', async () => {
    const bannerRepository = criarRepositorioMock();
    bannerRepository.criar.mockResolvedValue(criarBanner());

    const useCase = new CriarBannerUseCase(bannerRepository);
    await useCase.executar({ titulo: 'Promoção de inverno' });

    expect(bannerRepository.criar).toHaveBeenCalledWith({ titulo: 'Promoção de inverno' });
  });
});

describe('AtualizarBannerUseCase', () => {
  it('atualiza o banner existente', async () => {
    const bannerRepository = criarRepositorioMock();
    bannerRepository.buscarPorId.mockResolvedValue(criarBanner());
    bannerRepository.atualizar.mockResolvedValue(criarBanner());

    const useCase = new AtualizarBannerUseCase(bannerRepository);
    await useCase.executar('banner-1', { ativo: false });

    expect(bannerRepository.atualizar).toHaveBeenCalledWith('banner-1', { ativo: false });
  });

  it('lança exceção quando o banner não existe', async () => {
    const bannerRepository = criarRepositorioMock();
    bannerRepository.buscarPorId.mockResolvedValue(null);

    const useCase = new AtualizarBannerUseCase(bannerRepository);
    await expect(useCase.executar('inexistente', { ativo: false })).rejects.toBeInstanceOf(
      BannerNaoEncontradoException,
    );
    expect(bannerRepository.atualizar).not.toHaveBeenCalled();
  });
});

describe('ExcluirBannerUseCase', () => {
  it('exclui o banner existente', async () => {
    const bannerRepository = criarRepositorioMock();
    bannerRepository.buscarPorId.mockResolvedValue(criarBanner());

    const useCase = new ExcluirBannerUseCase(bannerRepository);
    await useCase.executar('banner-1');

    expect(bannerRepository.excluir).toHaveBeenCalledWith('banner-1');
  });

  it('lança exceção quando o banner não existe', async () => {
    const bannerRepository = criarRepositorioMock();
    bannerRepository.buscarPorId.mockResolvedValue(null);

    const useCase = new ExcluirBannerUseCase(bannerRepository);
    await expect(useCase.executar('inexistente')).rejects.toBeInstanceOf(
      BannerNaoEncontradoException,
    );
    expect(bannerRepository.excluir).not.toHaveBeenCalled();
  });
});

describe('ListarBannersUseCase', () => {
  it('devolve todos os banners do repositório', async () => {
    const bannerRepository = criarRepositorioMock();
    const banners = [criarBanner()];
    bannerRepository.listarTodos.mockResolvedValue(banners);

    const useCase = new ListarBannersUseCase(bannerRepository);
    await expect(useCase.executar()).resolves.toEqual(banners);
  });
});
