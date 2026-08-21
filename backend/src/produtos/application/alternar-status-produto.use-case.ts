import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../domain/produtos.exceptions';

/**
 * Ativa ou desativa um produto sem deletá-lo (soft delete lógico via campo `ativo`).
 * Produto desativado continua no banco (histórico de pedidos preservado),
 * mas some da listagem pública por padrão.
 */
@Injectable()
export class AlternarStatusProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async ativar(id: string): Promise<Produto> {
    await this.garantirQueExiste(id);
    return this.produtoRepository.atualizar(id, { ativo: true });
  }

  async desativar(id: string): Promise<Produto> {
    await this.garantirQueExiste(id);
    return this.produtoRepository.atualizar(id, { ativo: false });
  }

  private async garantirQueExiste(id: string): Promise<void> {
    const produto = await this.produtoRepository.buscarPorId(id);
    if (!produto) {
      throw new ProdutoNaoEncontradoException(id);
    }
  }
}
