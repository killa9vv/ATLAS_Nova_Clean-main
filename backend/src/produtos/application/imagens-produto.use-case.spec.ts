import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import {
  ProdutoNaoEncontradoException,
  ImagemProdutoNaoEncontradaException,
} from '../domain/produtos.exceptions';
import { ImagemProduto } from '../domain/imagem-produto.entity';
import { ImagemProdutoRepository } from '../domain/imagem-produto.repository';
import { ImageStorage } from '../domain/image-storage.port';
import { DefinirImagemPrincipalUseCase } from './definir-imagem-principal.use-case';
import { ListarImagensProdutoUseCase } from './listar-imagens-produto.use-case';
import { RemoverImagemProdutoUseCase } from './remover-imagem-produto.use-case';
import { UploadImagemProdutoUseCase } from './upload-imagem-produto.use-case';

function criarProduto(): Produto {
  return new Produto('prod-1', 'Detergente', 'detergente', 19.9, 10, true);
}

function criarProdutoRepositoryMock(): jest.Mocked<ProdutoRepository> {
  return {
    listarTodos: jest.fn(),
    listarComFiltros: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorIds: jest.fn(),
    buscarPorSlug: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    decrementarEstoque: jest.fn(),
    incrementarEstoque: jest.fn(),
  } as unknown as jest.Mocked<ProdutoRepository>;
}

function criarImagemRepositoryMock(): jest.Mocked<ImagemProdutoRepository> {
  return {
    listarPorProduto: jest.fn(),
    buscarPorId: jest.fn(),
    contarPorProduto: jest.fn(),
    criar: jest.fn(),
    excluir: jest.fn(),
    definirComoPrincipal: jest.fn(),
  } as unknown as jest.Mocked<ImagemProdutoRepository>;
}

function criarImageStorageMock(): jest.Mocked<ImageStorage> {
  return {
    upload: jest.fn(),
    remover: jest.fn(),
  } as unknown as jest.Mocked<ImageStorage>;
}

describe('UploadImagemProdutoUseCase', () => {
  it('lança exceção quando o produto não existe', async () => {
    const produtoRepository = criarProdutoRepositoryMock();
    produtoRepository.buscarPorId.mockResolvedValue(null);
    const imagemRepository = criarImagemRepositoryMock();
    const imageStorage = criarImageStorageMock();

    const useCase = new UploadImagemProdutoUseCase(
      produtoRepository,
      imagemRepository,
      imageStorage,
    );
    await expect(useCase.executar('inexistente', Buffer.from(''))).rejects.toBeInstanceOf(
      ProdutoNaoEncontradoException,
    );
    expect(imageStorage.upload).not.toHaveBeenCalled();
  });

  it('a primeira imagem do produto vira a principal (ordem 0)', async () => {
    const produtoRepository = criarProdutoRepositoryMock();
    produtoRepository.buscarPorId.mockResolvedValue(criarProduto());
    const imagemRepository = criarImagemRepositoryMock();
    imagemRepository.contarPorProduto.mockResolvedValue(0);
    imagemRepository.criar.mockResolvedValue(
      new ImagemProduto('img-1', 'prod-1', 'https://cdn/img.jpg', 'provider-1', 0),
    );
    const imageStorage = criarImageStorageMock();
    imageStorage.upload.mockResolvedValue({ url: 'https://cdn/img.jpg', providerId: 'provider-1' });

    const useCase = new UploadImagemProdutoUseCase(
      produtoRepository,
      imagemRepository,
      imageStorage,
    );
    const resultado = await useCase.executar('prod-1', Buffer.from('conteudo'));

    expect(imagemRepository.criar).toHaveBeenCalledWith({
      produtoId: 'prod-1',
      url: 'https://cdn/img.jpg',
      providerId: 'provider-1',
      ordem: 0,
    });
    expect(resultado.ehPrincipal()).toBe(true);
  });

  it('imagens seguintes vão pro fim da fila (ordem = contagem atual)', async () => {
    const produtoRepository = criarProdutoRepositoryMock();
    produtoRepository.buscarPorId.mockResolvedValue(criarProduto());
    const imagemRepository = criarImagemRepositoryMock();
    imagemRepository.contarPorProduto.mockResolvedValue(2);
    imagemRepository.criar.mockResolvedValue(
      new ImagemProduto('img-3', 'prod-1', 'https://cdn/img3.jpg', 'provider-3', 2),
    );
    const imageStorage = criarImageStorageMock();
    imageStorage.upload.mockResolvedValue({
      url: 'https://cdn/img3.jpg',
      providerId: 'provider-3',
    });

    const useCase = new UploadImagemProdutoUseCase(
      produtoRepository,
      imagemRepository,
      imageStorage,
    );
    await useCase.executar('prod-1', Buffer.from('conteudo'));

    expect(imagemRepository.criar).toHaveBeenCalledWith(expect.objectContaining({ ordem: 2 }));
  });
});

describe('RemoverImagemProdutoUseCase', () => {
  it('remove do storage e do banco quando a imagem existe', async () => {
    const imagemRepository = criarImagemRepositoryMock();
    imagemRepository.buscarPorId.mockResolvedValue(
      new ImagemProduto('img-1', 'prod-1', 'https://cdn/img.jpg', 'provider-1', 0),
    );
    const imageStorage = criarImageStorageMock();

    const useCase = new RemoverImagemProdutoUseCase(imagemRepository, imageStorage);
    await useCase.executar('img-1');

    expect(imageStorage.remover).toHaveBeenCalledWith('provider-1');
    expect(imagemRepository.excluir).toHaveBeenCalledWith('img-1');
  });

  it('lança exceção quando a imagem não existe', async () => {
    const imagemRepository = criarImagemRepositoryMock();
    imagemRepository.buscarPorId.mockResolvedValue(null);
    const imageStorage = criarImageStorageMock();

    const useCase = new RemoverImagemProdutoUseCase(imagemRepository, imageStorage);
    await expect(useCase.executar('inexistente')).rejects.toBeInstanceOf(
      ImagemProdutoNaoEncontradaException,
    );
    expect(imageStorage.remover).not.toHaveBeenCalled();
  });
});

describe('DefinirImagemPrincipalUseCase', () => {
  it('promove a imagem selecionada a principal', async () => {
    const imagemRepository = criarImagemRepositoryMock();
    const imagem = new ImagemProduto('img-2', 'prod-1', 'https://cdn/img2.jpg', 'provider-2', 1);
    imagemRepository.buscarPorId.mockResolvedValue(imagem);

    const useCase = new DefinirImagemPrincipalUseCase(imagemRepository);
    await useCase.executar('img-2');

    expect(imagemRepository.definirComoPrincipal).toHaveBeenCalledWith(imagem);
  });

  it('não faz nada quando a imagem já é a principal', async () => {
    const imagemRepository = criarImagemRepositoryMock();
    imagemRepository.buscarPorId.mockResolvedValue(
      new ImagemProduto('img-1', 'prod-1', 'https://cdn/img.jpg', 'provider-1', 0),
    );

    const useCase = new DefinirImagemPrincipalUseCase(imagemRepository);
    await useCase.executar('img-1');

    expect(imagemRepository.definirComoPrincipal).not.toHaveBeenCalled();
  });

  it('lança exceção quando a imagem não existe', async () => {
    const imagemRepository = criarImagemRepositoryMock();
    imagemRepository.buscarPorId.mockResolvedValue(null);

    const useCase = new DefinirImagemPrincipalUseCase(imagemRepository);
    await expect(useCase.executar('inexistente')).rejects.toBeInstanceOf(
      ImagemProdutoNaoEncontradaException,
    );
  });
});

describe('ListarImagensProdutoUseCase', () => {
  it('devolve as imagens do produto na ordem do repositório', async () => {
    const imagemRepository = criarImagemRepositoryMock();
    const imagens = [new ImagemProduto('img-1', 'prod-1', 'https://cdn/img.jpg', 'provider-1', 0)];
    imagemRepository.listarPorProduto.mockResolvedValue(imagens);

    const useCase = new ListarImagensProdutoUseCase(imagemRepository);
    await expect(useCase.executar('prod-1')).resolves.toEqual(imagens);
  });
});
