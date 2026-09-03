import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Cliente } from '../domain/cliente.entity';
import {
  ClienteRepository,
  DadosAtualizacaoCliente,
  DadosCriacaoCliente,
} from '../domain/cliente.repository';
import type { Cliente as ClientePrisma } from '@prisma/client';

@Injectable()
export class PrismaClienteRepository extends ClienteRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async criar(dados: DadosCriacaoCliente): Promise<Cliente> {
    const cliente = await this.prisma.cliente.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf,
        cnpj: dados.cnpj,
        senhaHash: dados.senhaHash,
      },
    });
    return this.paraDominio(cliente);
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    return cliente ? this.paraDominio(cliente) : null;
  }

  async buscarPorEmail(email: string): Promise<Cliente | null> {
    const cliente = await this.prisma.cliente.findUnique({ where: { email } });
    return cliente ? this.paraDominio(cliente) : null;
  }

  async atualizar(id: string, dados: DadosAtualizacaoCliente): Promise<Cliente> {
    const cliente = await this.prisma.cliente.update({
      where: { id },
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf,
        cnpj: dados.cnpj,
      },
    });
    return this.paraDominio(cliente);
  }

  async listarTodos(): Promise<Cliente[]> {
    const clientes = await this.prisma.cliente.findMany({ orderBy: { createdAt: 'desc' } });
    return clientes.map((cliente) => this.paraDominio(cliente));
  }

  async atualizarSenha(id: string, senhaHash: string): Promise<void> {
    await this.prisma.cliente.update({ where: { id }, data: { senhaHash } });
  }

  private paraDominio(cliente: ClientePrisma): Cliente {
    return new Cliente(
      cliente.id,
      cliente.nome,
      cliente.email ?? undefined,
      cliente.telefone ?? undefined,
      cliente.cpf ?? undefined,
      cliente.cnpj ?? undefined,
      cliente.createdAt,
      cliente.senhaHash ?? undefined,
    );
  }
}
