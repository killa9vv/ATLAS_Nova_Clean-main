import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { EnderecosController } from './enderecos.controller';
import { PrismaClienteRepository } from './prisma-cliente.repository';
import { PrismaEnderecoRepository } from './prisma-endereco.repository';
import { ViaCepAdapter } from './gateways/via-cep.adapter';
import { ClienteRepository } from '../domain/cliente.repository';
import { EnderecoRepository } from '../domain/endereco.repository';
import { CepLookupProvider } from '../domain/cep-lookup.port';
import { CriarClienteUseCase } from '../application/criar-cliente.use-case';
import { AtualizarClienteUseCase } from '../application/atualizar-cliente.use-case';
import { BuscarClientePorIdUseCase } from '../application/buscar-cliente-por-id.use-case';
import { ListarClientesUseCase } from '../application/listar-clientes.use-case';
import { BuscarEnderecoPorCepUseCase } from '../application/buscar-endereco-por-cep.use-case';
import { CriarEnderecoUseCase } from '../application/criar-endereco.use-case';
import { ListarEnderecosUseCase } from '../application/listar-enderecos.use-case';
import { AtualizarEnderecoUseCase } from '../application/atualizar-endereco.use-case';
import { ExcluirEnderecoUseCase } from '../application/excluir-endereco.use-case';
import { DefinirEnderecoPadraoUseCase } from '../application/definir-endereco-padrao.use-case';

@Module({
  controllers: [ClientesController, EnderecosController],
  providers: [
    { provide: ClienteRepository, useClass: PrismaClienteRepository },
    { provide: EnderecoRepository, useClass: PrismaEnderecoRepository },
    { provide: CepLookupProvider, useClass: ViaCepAdapter },
    CriarClienteUseCase,
    AtualizarClienteUseCase,
    BuscarClientePorIdUseCase,
    ListarClientesUseCase,
    BuscarEnderecoPorCepUseCase,
    CriarEnderecoUseCase,
    ListarEnderecosUseCase,
    AtualizarEnderecoUseCase,
    ExcluirEnderecoUseCase,
    DefinirEnderecoPadraoUseCase,
  ],
  exports: [ClienteRepository, EnderecoRepository],
})
export class ClientesModule {}
