import { DomainException } from '../../shared/exceptions/domain.exception';

export class MarcaNaoEncontradaException extends DomainException {
  readonly code = 'MARCA_NAO_ENCONTRADA';

  constructor(id: string) {
    super(`Marca ${id} não encontrada.`);
  }
}

export class MarcaComProdutosVinculadosException extends DomainException {
  readonly code = 'MARCA_COM_PRODUTOS_VINCULADOS';

  constructor(id: string) {
    super(`Marca ${id} não pode ser excluída: existem produtos vinculados a ela.`);
  }
}

export class MarcaDuplicadaException extends DomainException {
  readonly code = 'MARCA_DUPLICADA';

  constructor(nome: string) {
    super(`Já existe uma marca chamada "${nome}".`);
  }
}
