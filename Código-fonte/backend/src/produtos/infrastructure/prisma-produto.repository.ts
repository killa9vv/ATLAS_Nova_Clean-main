import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Produto } from '../domain/produto.entity';
import {
  DadosAtualizacaoProduto,
  DadosCriacaoProduto,
  FiltrosListagemProdutos,
  ItemParaAjustarEstoque,
  ItemParaDecrementarEstoque,
  ProdutoRepository,
  ResultadoPaginado,
} from '../domain/produto.repository';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import type {
  Produto as ProdutoPrisma,
  Marca as MarcaPrisma,
  ProdutoTipo as ProdutoTipoPrisma,
  ImagemProduto as ImagemProdutoPrisma,
  Prisma,
} from '@prisma/client';
import { gerarUrlThumbnail } from '../../shared/cloudinary-thumbnail.util';

// Pedidos nesses status foram pagos de verdade (e, no caso de SEPARACAO em diante,
// seguem pagos) — é o que conta como "venda" pra ranking de mais vendidos. Excluídos:
// CRIADO/AGUARDANDO_* (nunca chegaram a ser pagos) e CANCELADO/ESTORNADO (revertidos).
const STATUS_CONTAM_COMO_VENDA: StatusPedido[] = [
  StatusPedido.PAGO,
  StatusPedido.SEPARACAO,
  StatusPedido.ENVIADO,
  StatusPedido.ENTREGUE,
];

/** Cliente Prisma "normal" ou um client de transação (`tx` de `$transaction`) — mesma API pros métodos usados aqui. */
type ClientePrisma = PrismaService | Prisma.TransactionClient;

type ProdutoComRelacoes = ProdutoPrisma & {
  marca: MarcaPrisma | null;
  produtoTipo: ProdutoTipoPrisma | null;
  imagens: ImagemProdutoPrisma[];
};

// imagens: só a de ordem 0 (principal, por convenção — ver ImagemProduto), uma por
// produto, no mesmo JOIN — é o que a listagem (catálogo, mais vendidos, etc.) precisa
// pro card. Sem isso, cada card faria sua própria chamada GET .../imagens (N+1 real:
// chegou a estourar rate-limit só carregando a home com ~20 cards).
const INCLUDE_RELACOES = {
  marca: true,
  produtoTipo: true,
  imagens: { where: { ordem: 0 }, take: 1 },
} as const;

@Injectable()
export class PrismaProdutoRepository extends ProdutoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodos(): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({ include: INCLUDE_RELACOES });
    return produtos.map((produto) => this.paraDominio(produto));
  }

  async listarComFiltros(filtros: FiltrosListagemProdutos): Promise<ResultadoPaginado<Produto>> {
    const {
      pagina,
      limite,
      busca,
      categoria,
      marcaId,
      produtoTipoSlug,
      categorias,
      marcaIds,
      precoMin,
      precoMax,
      disponivel,
      ativo,
      emPromocao,
      ordenarPor = 'createdAt',
      direcao = 'desc',
    } = filtros;

    const whereSemFaixaPreco: Prisma.ProdutoWhereInput = {};

    if (busca) {
      whereSemFaixaPreco.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
      ];
    }
    // `categoria`/`marcaId` (singular) e `categorias`/`marcaIds` (plural) são
    // dimensões independentes — quem chama usa um ou outro, nunca os dois pro
    // mesmo filtro. `in` já expressa "qualquer uma destas" sem precisar de OR
    // (que já está ocupado por `busca` acima).
    if (categoria) whereSemFaixaPreco.categoria = categoria;
    if (marcaId) whereSemFaixaPreco.marcaId = marcaId;
    if (produtoTipoSlug) whereSemFaixaPreco.produtoTipo = { slug: produtoTipoSlug };
    if (categorias && categorias.length > 0) whereSemFaixaPreco.categoria = { in: categorias };
    if (marcaIds && marcaIds.length > 0) whereSemFaixaPreco.marcaId = { in: marcaIds };
    if (disponivel) whereSemFaixaPreco.estoque = { gt: 0 };
    if (ativo !== undefined) whereSemFaixaPreco.ativo = ativo;
    // A invariante precoPromocional < preco é garantida na escrita (use case), então
    // "tem promoção ativa" aqui é só "o campo está preenchido".
    if (emPromocao) whereSemFaixaPreco.precoPromocional = { not: null };

    const where: Prisma.ProdutoWhereInput = { ...whereSemFaixaPreco };
    if (precoMin !== undefined || precoMax !== undefined) {
      where.preco = {
        ...(precoMin !== undefined ? { gte: precoMin } : {}),
        ...(precoMax !== undefined ? { lte: precoMax } : {}),
      };
    }

    const [produtos, total, faixaPreco] = await this.prisma.$transaction([
      this.prisma.produto.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { [ordenarPor]: direcao },
        include: INCLUDE_RELACOES,
      }),
      this.prisma.produto.count({ where }),
      // Ignora precoMin/precoMax de propósito — os limites do slider não podem
      // encolher conforme o próprio slider é usado. Os outros filtros (categoria,
      // marca, busca, disponibilidade) continuam valendo, pra refletir a faixa real
      // do recorte atual.
      this.prisma.produto.aggregate({
        where: whereSemFaixaPreco,
        _min: { preco: true },
        _max: { preco: true },
      }),
    ]);

    return {
      itens: produtos.map((produto) => this.paraDominio(produto)),
      total,
      pagina,
      limite,
      precoMinCatalogo: faixaPreco._min.preco !== null ? Number(faixaPreco._min.preco) : undefined,
      precoMaxCatalogo: faixaPreco._max.preco !== null ? Number(faixaPreco._max.preco) : undefined,
    };
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: INCLUDE_RELACOES,
    });
    return produto ? this.paraDominio(produto) : null;
  }

  async buscarPorIds(ids: string[]): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({
      where: { id: { in: ids } },
      include: INCLUDE_RELACOES,
    });
    return produtos.map((produto) => this.paraDominio(produto));
  }

  async buscarPorSlug(slug: string): Promise<Produto | null> {
    const produto = await this.prisma.produto.findUnique({
      where: { slug },
      include: INCLUDE_RELACOES,
    });
    return produto ? this.paraDominio(produto) : null;
  }

  async criar(dados: DadosCriacaoProduto): Promise<Produto> {
    const produto = await this.prisma.produto.create({
      data: {
        nome: dados.nome,
        slug: dados.slug,
        preco: dados.preco,
        estoque: dados.estoque,
        descricao: dados.descricao,
        categoria: dados.categoria,
        pesoKg: dados.pesoKg,
        alturaCm: dados.alturaCm,
        larguraCm: dados.larguraCm,
        comprimentoCm: dados.comprimentoCm,
        precoPromocional: dados.precoPromocional,
      },
    });
    return this.paraDominio(produto);
  }

  async atualizar(id: string, dados: DadosAtualizacaoProduto): Promise<Produto> {
    const produto = await this.prisma.produto.update({
      where: { id },
      data: {
        nome: dados.nome,
        slug: dados.slug,
        preco: dados.preco,
        estoque: dados.estoque,
        descricao: dados.descricao,
        categoria: dados.categoria,
        ativo: dados.ativo,
        pesoKg: dados.pesoKg,
        alturaCm: dados.alturaCm,
        larguraCm: dados.larguraCm,
        comprimentoCm: dados.comprimentoCm,
        // undefined = Prisma ignora o campo (não mexe); null = limpa a coluna.
        precoPromocional: dados.precoPromocional,
      },
    });
    return this.paraDominio(produto);
  }

  async listarMaisVendidos(limite: number): Promise<Produto[]> {
    // Busca uma folga a mais (2x) porque `buscarPorIds` abaixo ainda filtra por
    // ativo=true — sem a folga, produtos mais vendidos porém desativados
    // reduziriam a lista final pra menos que `limite`.
    const agregado = await this.prisma.itemPedido.groupBy({
      by: ['produtoId'],
      where: { pedido: { status: { in: STATUS_CONTAM_COMO_VENDA } } },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: limite * 2,
    });

    if (agregado.length === 0) return [];

    const produtos = await this.prisma.produto.findMany({
      where: { id: { in: agregado.map((item) => item.produtoId) }, ativo: true },
      include: INCLUDE_RELACOES,
    });

    // findMany não preserva a ordem de `in` — reordena pela posição no agregado.
    const ordemPorId = new Map(agregado.map((item, indice) => [item.produtoId, indice]));
    produtos.sort((a, b) => (ordemPorId.get(a.id) ?? 0) - (ordemPorId.get(b.id) ?? 0));

    return produtos.slice(0, limite).map((produto) => this.paraDominio(produto));
  }

  async decrementarEstoque(itens: ItemParaDecrementarEstoque[], contexto?: unknown): Promise<void> {
    const decrementar = async (cliente: ClientePrisma) => {
      for (const item of itens) {
        const resultado = await cliente.produto.updateMany({
          where: { id: item.produtoId, estoque: { gte: item.quantidade } },
          data: { estoque: { decrement: item.quantidade } },
        });

        if (resultado.count === 0) {
          throw new EstoqueInsuficienteException(item.nome);
        }
      }
    };

    // Se já rodamos dentro de uma transação externa (contexto vindo de
    // TransactionManager, ex.: junto da criação do pedido), reaproveita o mesmo
    // client em vez de abrir uma transação aninhada. Sem contexto, abre a própria
    // transação — mantém o método atômico também quando usado sozinho.
    if (contexto) {
      await decrementar(contexto as Prisma.TransactionClient);
      return;
    }
    await this.prisma.$transaction((tx) => decrementar(tx));
  }

  async incrementarEstoque(itens: ItemParaAjustarEstoque[], contexto?: unknown): Promise<void> {
    const incrementar = async (cliente: ClientePrisma) => {
      for (const item of itens) {
        await cliente.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { increment: item.quantidade } },
        });
      }
    };

    if (contexto) {
      await incrementar(contexto as Prisma.TransactionClient);
      return;
    }
    await this.prisma.$transaction((tx) => incrementar(tx));
  }

  private paraDominio(produto: ProdutoPrisma | ProdutoComRelacoes): Produto {
    const marca = 'marca' in produto ? produto.marca : undefined;
    const produtoTipo = 'produtoTipo' in produto ? produto.produtoTipo : undefined;
    const imagemPrincipal = 'imagens' in produto ? produto.imagens[0] : undefined;

    return new Produto(
      produto.id,
      produto.nome,
      produto.slug,
      Number(produto.preco),
      produto.estoque,
      produto.ativo,
      produto.descricao ?? undefined,
      produto.categoria ?? undefined,
      produto.createdAt,
      produto.updatedAt,
      produto.pesoKg !== null ? Number(produto.pesoKg) : undefined,
      produto.alturaCm !== null ? Number(produto.alturaCm) : undefined,
      produto.larguraCm !== null ? Number(produto.larguraCm) : undefined,
      produto.comprimentoCm !== null ? Number(produto.comprimentoCm) : undefined,
      produto.pack ?? undefined,
      marca
        ? { id: marca.id, nome: marca.nome, imagemUrl: marca.imagemUrl ?? undefined }
        : undefined,
      produtoTipo?.slug
        ? {
            slug: produtoTipo.slug,
            nome: produtoTipo.nome,
            infoTecnica: produtoTipo.infoTecnica ?? undefined,
            precaucoes: produtoTipo.precaucoes ?? undefined,
          }
        : undefined,
      produto.precoPromocional !== null ? Number(produto.precoPromocional) : undefined,
      produto.categoriaId ?? undefined,
      imagemPrincipal ? gerarUrlThumbnail(imagemPrincipal.url) : undefined,
    );
  }
}
