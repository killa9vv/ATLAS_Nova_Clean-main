export class ImagemProduto {
  constructor(
    public readonly id: string,
    public readonly produtoId: string,
    public readonly url: string,
    public readonly providerId: string,
    public readonly ordem: number,
  ) {}

  /** Convenção: a imagem de ordem 0 é a principal — não existe flag separada pra isso. */
  ehPrincipal(): boolean {
    return this.ordem === 0;
  }
}
