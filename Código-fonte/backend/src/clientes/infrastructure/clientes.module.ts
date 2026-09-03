import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/infrastructure/auth.module';
import { ClientesController } from './clientes.controller';
import { EnderecosController } from './enderecos.controller';
import { ClientesAuthController } from './clientes-auth.controller';
import { PrismaClienteRepository } from './prisma-cliente.repository';
import { PrismaEnderecoRepository } from './prisma-endereco.repository';
import { PrismaTokenRecuperacaoSenhaRepository } from './prisma-token-recuperacao-senha.repository';
import { PrismaRefreshTokenRepository } from './prisma-refresh-token.repository';
import { ViaCepAdapter } from './gateways/via-cep.adapter';
import { ClienteRepository } from '../domain/cliente.repository';
import { EnderecoRepository } from '../domain/endereco.repository';
import { TokenRecuperacaoSenhaRepository } from '../domain/token-recuperacao-senha.repository';
import { RefreshTokenRepository } from '../domain/refresh-token.repository';
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
import { LoginClienteUseCase } from '../application/auth/login-cliente.use-case';
import { RenovarTokenUseCase } from '../application/auth/renovar-token.use-case';
import { SolicitarRecuperacaoSenhaUseCase } from '../application/auth/solicitar-recuperacao-senha.use-case';
import { RedefinirSenhaUseCase } from '../application/auth/redefinir-senha.use-case';
import { TrocarSenhaUseCase } from '../application/auth/trocar-senha.use-case';

@Module({
  imports: [AuthModule],
  controllers: [ClientesController, EnderecosController, ClientesAuthController],
  providers: [
    { provide: ClienteRepository, useClass: PrismaClienteRepository },
    { provide: EnderecoRepository, useClass: PrismaEnderecoRepository },
    { provide: TokenRecuperacaoSenhaRepository, useClass: PrismaTokenRecuperacaoSenhaRepository },
    { provide: RefreshTokenRepository, useClass: PrismaRefreshTokenRepository },
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
    LoginClienteUseCase,
    RenovarTokenUseCase,
    SolicitarRecuperacaoSenhaUseCase,
    RedefinirSenhaUseCase,
    TrocarSenhaUseCase,
  ],
  exports: [ClienteRepository, EnderecoRepository],
})
export class ClientesModule {}
