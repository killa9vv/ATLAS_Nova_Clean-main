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
        apelido: dados.apelido,
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
    const enderecoAtualizado = await this.prisma.$transaction(async (tx) => {
      // Trava TODAS as linhas de endereço do cliente antes de decidir o que
      // atualizar — não só a que hoje é padrão. Um UPDATE condicionado a
      // "padrao = true" só trava a linha que encontra; se duas chamadas
      // concorrentes miram endereços diferentes e nenhuma delas ainda vê a nova
      // linha padrão da outra (cada UPDATE re-checa só a linha que já estava
      // mirando, não descobre linhas que passaram a bater com o WHERE depois que
      // a instrução começou), as duas conseguem setar padrao=true em paralelo e
      // só uma sobrevive ao índice único parcial — a outra estoura 500 em vez de
      // ser serializada. Travar o conjunto inteiro do cliente fecha essa janela:
      // a segunda chamada espera a primeira commitar e aí decide com dado fresco.
      await tx.$queryRaw`SELECT id FROM enderecos WHERE cliente_id = ${clienteId} FOR UPDATE`;

      await tx.endereco.updateMany({
        where: { clienteId, padrao: true, NOT: { id } },
        data: { padrao: false },
      });

      return tx.endereco.update({ where: { id }, data: { padrao: true } });
    });
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
      endereco.apelido ?? undefined,
    );
  }
}
