import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Endereco } from '../domain/endereco.entity';
import {
  DadosAtualizacaoEndereco,
  DadosCriacaoEndereco,
  EnderecoRepository,
} from '../domain/endereco.repository';
import type { Endereco as EnderecoPrisma } from '@prisma/client';

@Injectable()
export class PrismaEnderecoRepository extends EnderecoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async criar(dados: DadosCriacaoEndereco): Promise<Endereco> {
    const endereco = await this.prisma.endereco.create({
      data: {
        clienteId: dados.clienteId,
        cep: dados.cep,
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        padrao: dados.padrao ?? false,
      },
    });
    return this.paraDominio(endereco);
  }

  async listarPorCliente(clienteId: string): Promise<Endereco[]> {
    const enderecos = await this.prisma.endereco.findMany({
      where: { clienteId },
      orderBy: [{ padrao: 'desc' }, { id: 'asc' }],
    });
    return enderecos.map((endereco) => this.paraDominio(endereco));
  }

  async buscarPorId(id: string): Promise<Endereco | null> {
    const endereco = await this.prisma.endereco.findUnique({ where: { id } });
    return endereco ? this.paraDominio(endereco) : null;
  }

  async atualizar(id: string, dados: DadosAtualizacaoEndereco): Promise<Endereco> {
    const endereco = await this.prisma.endereco.update({ where: { id }, data: dados });
    return this.paraDominio(endereco);
  }

  async excluir(id: string): Promise<void> {
    await this.prisma.endereco.delete({ where: { id } });
  }

  async definirComoPadrao(id: string, clienteId: string): Promise<Endereco> {
    const [, enderecoAtualizado] = await this.prisma.$transaction([
      this.prisma.endereco.updateMany({
        where: { clienteId, padrao: true, NOT: { id } },
        data: { padrao: false },
      }),
      this.prisma.endereco.update({ where: { id }, data: { padrao: true } }),
    ]);
    return this.paraDominio(enderecoAtualizado);
  }

  private paraDominio(endereco: EnderecoPrisma): Endereco {
    return new Endereco(
      endereco.id,
      endereco.clienteId,
      endereco.cep,
      endereco.logradouro,
      endereco.numero,
      endereco.bairro,
      endereco.cidade,
      endereco.estado,
      endereco.padrao,
      endereco.complemento ?? undefined,
    );
  }
}
