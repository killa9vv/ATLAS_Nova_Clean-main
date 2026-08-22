import { DomainException } from '../../shared/exceptions/domain.exception';

export class CategoriaNaoEncontradaException extends DomainException {
  readonly code = 'CATEGORIA_NAO_ENCONTRADA';

  constructor(id: string) {
    super(`Categoria ${id} não encontrada.`);
  }
}

export class CategoriaComProdutosVinculadosException extends DomainException {
  readonly code = 'CATEGORIA_COM_PRODUTOS_VINCULADOS';

  constructor(id: string) {
    super(`Categoria ${id} não pode ser excluída: existem produtos vinculados a ela.`);
  }
}
