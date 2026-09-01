import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Marca } from '../domain/marca.entity';
import { MarcaRepository } from '../domain/marca.repository';
import type { Marca as MarcaPrisma } from '@prisma/client';

@Injectable()
export class PrismaMarcaRepository extends MarcaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodas(): Promise<Marca[]> {
    const marcas = await this.prisma.marca.findMany({ orderBy: { nome: 'asc' } });
    return marcas.map((marca) => this.paraDominio(marca));
  }

  async buscarPorId(id: string): Promise<Marca | null> {
    const marca = await this.prisma.marca.findUnique({ where: { id } });
    return marca ? this.paraDominio(marca) : null;
  }

  async buscarPorNome(nome: string): Promise<Marca | null> {
    const marca = await this.prisma.marca.findUnique({ where: { nome } });
    return marca ? this.paraDominio(marca) : null;
  }

  async criar(nome: string): Promise<Marca> {
    const marca = await this.prisma.marca.create({ data: { nome } });
    return this.paraDominio(marca);
  }

  async atualizar(id: string, nome: string): Promise<Marca> {
    const marca = await this.prisma.marca.update({ where: { id }, data: { nome } });
    return this.paraDominio(marca);
  }

  async excluir(id: string): Promise<void> {
    await this.prisma.marca.delete({ where: { id } });
  }

  async possuiProdutosVinculados(id: string): Promise<boolean> {
    const total = await this.prisma.produto.count({ where: { marcaId: id } });
    return total > 0;
  }

  private paraDominio(marca: MarcaPrisma): Marca {
    return new Marca(marca.id, marca.nome, marca.imagemUrl ?? undefined);
  }
}
