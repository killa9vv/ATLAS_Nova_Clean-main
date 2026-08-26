import { DomainException } from '../../shared/exceptions/domain.exception';

export class ProdutoNaoEncontradoException extends DomainException {
  readonly code = 'PRODUTO_NAO_ENCONTRADO';

  constructor(id: string) {
    super(`Produto ${id} não encontrado.`);
  }
}

export class ImagemProdutoNaoEncontradaException extends DomainException {
  readonly code = 'IMAGEM_PRODUTO_NAO_ENCONTRADA';

  constructor(id: string) {
    super(`Imagem ${id} não encontrada.`);
  }
}
