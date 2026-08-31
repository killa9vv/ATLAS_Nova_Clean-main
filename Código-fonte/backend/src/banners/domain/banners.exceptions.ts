import { DomainException } from '../../shared/exceptions/domain.exception';

export class BannerNaoEncontradoException extends DomainException {
  readonly code = 'BANNER_NAO_ENCONTRADO';

  constructor(id: string) {
    super(`Banner ${id} não encontrado.`);
  }
}
