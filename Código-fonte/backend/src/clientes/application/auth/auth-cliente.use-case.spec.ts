import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Cliente } from '../../domain/cliente.entity';
import { ClienteRepository } from '../../domain/cliente.repository';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { TokenRecuperacaoSenhaRepository } from '../../domain/token-recuperacao-senha.repository';
import { TokenRecuperacaoSenha } from '../../domain/token-recuperacao-senha.entity';
import {
  ClienteNaoEncontradoException,
  CredenciaisInvalidasException,
  EmailJaCadastradoException,
  TokenRecuperacaoInvalidoException,
} from '../../domain/clientes.exceptions';
import { LoginClienteUseCase } from './login-cliente.use-case';
import { RenovarTokenUseCase } from './renovar-token.use-case';
import { RedefinirSenhaUseCase } from './redefinir-senha.use-case';
import { TrocarSenhaUseCase } from './trocar-senha.use-case';
import { SolicitarRecuperacaoSenhaUseCase } from './solicitar-recuperacao-senha.use-case';
import { SolicitarCriacaoContaUseCase } from './solicitar-criacao-conta.use-case';
import { EmailQueuePort } from '../../../emails/domain/email-queue.port';
import { hashToken } from '../../../shared/token.util';

const SENHA_CLARA = 'senha-forte-123';
let senhaHash: string;

beforeAll(async () => {
  senhaHash = await bcrypt.hash(SENHA_CLARA, 4); // custo baixo só pra teste rodar rápido
});

function criarClienteMock(comSenha = true): Cliente {
  return new Cliente(
    'cli-1',
    'Maria da Silva',
    'maria@teste.com',
    undefined,
    undefined,
    undefined,
    new Date(),
    comSenha ? senhaHash : undefined,
  );
}

function criarClienteRepositoryMock(): jest.Mocked<ClienteRepository> {
  return {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorEmail: jest.fn(),
    atualizar: jest.fn(),
    listarTodos: jest.fn(),
    atualizarSenha: jest.fn(),
  } as unknown as jest.Mocked<ClienteRepository>;
}

function criarEmailQueueMock(): jest.Mocked<EmailQueuePort> {
  return { enfileirar: jest.fn() } as unknown as jest.Mocked<EmailQueuePort>;
}

function criarRefreshTokenRepositoryMock(): jest.Mocked<RefreshTokenRepository> {
  return {
    criar: jest.fn(),
    buscarPorHash: jest.fn(),
    revogar: jest.fn(),
    revogarTodosDoCliente: jest.fn(),
  } as unknown as jest.Mocked<RefreshTokenRepository>;
}

function criarTokenRecuperacaoRepositoryMock(): jest.Mocked<TokenRecuperacaoSenhaRepository> {
  return {
    criar: jest.fn(),
    buscarPorHash: jest.fn(),
    marcarComoUsado: jest.fn(),
    invalidarValidosDoCliente: jest.fn(),
  } as unknown as jest.Mocked<TokenRecuperacaoSenhaRepository>;
}

function criarJwtServiceMock(): jest.Mocked<JwtService> {
  return {
    signAsync: jest.fn().mockResolvedValue('fake-jwt-token'),
  } as unknown as jest.Mocked<JwtService>;
}

describe('LoginClienteUseCase', () => {
  it('loga com sucesso, devolve access+refresh token', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const jwtService = criarJwtServiceMock();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock());
    refreshTokenRepository.criar.mockResolvedValue(
      new RefreshToken('rt-1', 'cli-1', 'hash', new Date(), new Date()),
    );

    const useCase = new LoginClienteUseCase(clienteRepository, refreshTokenRepository, jwtService);
    const resultado = await useCase.executar({ email: 'maria@teste.com', senha: SENHA_CLARA });

    expect(resultado.accessToken).toBe('fake-jwt-token');
    expect(resultado.refreshToken).toBeTruthy();
    expect(resultado.cliente.id).toBe('cli-1');
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'cli-1', papel: 'CLIENTE' }),
      expect.objectContaining({ expiresIn: '1h' }),
    );
  });

  it('rejeita senha errada', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const jwtService = criarJwtServiceMock();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock());

    const useCase = new LoginClienteUseCase(clienteRepository, refreshTokenRepository, jwtService);

    await expect(
      useCase.executar({ email: 'maria@teste.com', senha: 'senha-errada' }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasException);
  });

  it('rejeita cliente sem senha (só existe do checkout de convidado)', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const jwtService = criarJwtServiceMock();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock(false));

    const useCase = new LoginClienteUseCase(clienteRepository, refreshTokenRepository, jwtService);

    await expect(
      useCase.executar({ email: 'maria@teste.com', senha: SENHA_CLARA }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasException);
  });

  it('rejeita e-mail inexistente com o mesmo erro genérico', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const jwtService = criarJwtServiceMock();
    clienteRepository.buscarPorEmail.mockResolvedValue(null);

    const useCase = new LoginClienteUseCase(clienteRepository, refreshTokenRepository, jwtService);

    await expect(
      useCase.executar({ email: 'ninguem@teste.com', senha: SENHA_CLARA }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasException);
  });
});

describe('RenovarTokenUseCase', () => {
  it('rotaciona: revoga o token usado e emite um par novo', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const jwtService = criarJwtServiceMock();
    const tokenValido = new RefreshToken(
      'rt-1',
      'cli-1',
      'hash-qualquer',
      new Date(Date.now() + 10_000),
      new Date(),
    );
    refreshTokenRepository.buscarPorHash.mockResolvedValue(tokenValido);
    clienteRepository.buscarPorId.mockResolvedValue(criarClienteMock());
    refreshTokenRepository.criar.mockResolvedValue(
      new RefreshToken('rt-2', 'cli-1', 'hash-novo', new Date(), new Date()),
    );

    const useCase = new RenovarTokenUseCase(clienteRepository, refreshTokenRepository, jwtService);
    const resultado = await useCase.executar('valor-cru-qualquer');

    expect(refreshTokenRepository.revogar).toHaveBeenCalledWith('rt-1');
    expect(resultado.accessToken).toBe('fake-jwt-token');
    expect(resultado.refreshToken).toBeTruthy();
  });

  it('rejeita token expirado', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const jwtService = criarJwtServiceMock();
    const tokenExpirado = new RefreshToken(
      'rt-1',
      'cli-1',
      'hash',
      new Date(Date.now() - 10_000),
      new Date(),
    );
    refreshTokenRepository.buscarPorHash.mockResolvedValue(tokenExpirado);

    const useCase = new RenovarTokenUseCase(clienteRepository, refreshTokenRepository, jwtService);

    await expect(useCase.executar('valor-cru')).rejects.toBeInstanceOf(
      CredenciaisInvalidasException,
    );
  });

  it('rejeita token já revogado', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const jwtService = criarJwtServiceMock();
    const tokenRevogado = new RefreshToken(
      'rt-1',
      'cli-1',
      'hash',
      new Date(Date.now() + 10_000),
      new Date(),
      new Date(),
    );
    refreshTokenRepository.buscarPorHash.mockResolvedValue(tokenRevogado);

    const useCase = new RenovarTokenUseCase(clienteRepository, refreshTokenRepository, jwtService);

    await expect(useCase.executar('valor-cru')).rejects.toBeInstanceOf(
      CredenciaisInvalidasException,
    );
  });
});

describe('RedefinirSenhaUseCase', () => {
  it('redefine a senha, marca o token como usado, e revoga todos os refresh tokens', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const tokenValido = new TokenRecuperacaoSenha(
      'tok-1',
      'cli-1',
      hashToken('valor-cru'),
      new Date(Date.now() + 60_000),
      new Date(),
    );
    tokenRepository.buscarPorHash.mockResolvedValue(tokenValido);

    const useCase = new RedefinirSenhaUseCase(
      clienteRepository,
      tokenRepository,
      refreshTokenRepository,
    );
    await useCase.executar('valor-cru', 'senha-nova-456');

    expect(clienteRepository.atualizarSenha).toHaveBeenCalledWith('cli-1', expect.any(String));
    expect(tokenRepository.marcarComoUsado).toHaveBeenCalledWith('tok-1');
    expect(refreshTokenRepository.revogarTodosDoCliente).toHaveBeenCalledWith('cli-1');
  });

  it('rejeita token já usado', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const tokenUsado = new TokenRecuperacaoSenha(
      'tok-1',
      'cli-1',
      hashToken('valor-cru'),
      new Date(Date.now() + 60_000),
      new Date(),
      new Date(),
    );
    tokenRepository.buscarPorHash.mockResolvedValue(tokenUsado);

    const useCase = new RedefinirSenhaUseCase(
      clienteRepository,
      tokenRepository,
      refreshTokenRepository,
    );

    await expect(useCase.executar('valor-cru', 'senha-nova-456')).rejects.toBeInstanceOf(
      TokenRecuperacaoInvalidoException,
    );
    expect(clienteRepository.atualizarSenha).not.toHaveBeenCalled();
  });

  it('rejeita token expirado', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    const tokenExpirado = new TokenRecuperacaoSenha(
      'tok-1',
      'cli-1',
      hashToken('valor-cru'),
      new Date(Date.now() - 60_000),
      new Date(),
    );
    tokenRepository.buscarPorHash.mockResolvedValue(tokenExpirado);

    const useCase = new RedefinirSenhaUseCase(
      clienteRepository,
      tokenRepository,
      refreshTokenRepository,
    );

    await expect(useCase.executar('valor-cru', 'senha-nova-456')).rejects.toBeInstanceOf(
      TokenRecuperacaoInvalidoException,
    );
  });

  it('rejeita token inexistente', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    tokenRepository.buscarPorHash.mockResolvedValue(null);

    const useCase = new RedefinirSenhaUseCase(
      clienteRepository,
      tokenRepository,
      refreshTokenRepository,
    );

    await expect(useCase.executar('valor-cru', 'senha-nova-456')).rejects.toBeInstanceOf(
      TokenRecuperacaoInvalidoException,
    );
  });
});

describe('TrocarSenhaUseCase', () => {
  it('troca a senha quando a atual está correta, e revoga refresh tokens', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    clienteRepository.buscarPorId.mockResolvedValue(criarClienteMock());

    const useCase = new TrocarSenhaUseCase(clienteRepository, refreshTokenRepository);
    await useCase.executar('cli-1', SENHA_CLARA, 'senha-nova-789');

    expect(clienteRepository.atualizarSenha).toHaveBeenCalledWith('cli-1', expect.any(String));
    expect(refreshTokenRepository.revogarTodosDoCliente).toHaveBeenCalledWith('cli-1');
  });

  it('rejeita quando a senha atual está errada', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    clienteRepository.buscarPorId.mockResolvedValue(criarClienteMock());

    const useCase = new TrocarSenhaUseCase(clienteRepository, refreshTokenRepository);

    await expect(
      useCase.executar('cli-1', 'senha-errada', 'senha-nova-789'),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasException);
    expect(clienteRepository.atualizarSenha).not.toHaveBeenCalled();
  });

  it('rejeita cliente inexistente', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const refreshTokenRepository = criarRefreshTokenRepositoryMock();
    clienteRepository.buscarPorId.mockResolvedValue(null);

    const useCase = new TrocarSenhaUseCase(clienteRepository, refreshTokenRepository);

    await expect(useCase.executar('cli-1', SENHA_CLARA, 'senha-nova-789')).rejects.toBeInstanceOf(
      ClienteNaoEncontradoException,
    );
  });
});

describe('SolicitarRecuperacaoSenhaUseCase', () => {
  it('gera o token, persiste o hash e enfileira o e-mail quando o cliente existe e tem senha', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const emailQueue = criarEmailQueueMock();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock());

    const useCase = new SolicitarRecuperacaoSenhaUseCase(
      clienteRepository,
      tokenRepository,
      emailQueue,
    );
    await useCase.executar('maria@teste.com');

    expect(tokenRepository.invalidarValidosDoCliente).toHaveBeenCalledWith('cli-1');
    expect(tokenRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: 'cli-1' }),
    );
    expect(emailQueue.enfileirar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'RECUPERACAO_SENHA', destinatario: 'maria@teste.com' }),
    );
  });

  it('não gera token nem enfileira e-mail pra e-mail inexistente (não revela se existe)', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const emailQueue = criarEmailQueueMock();
    clienteRepository.buscarPorEmail.mockResolvedValue(null);

    const useCase = new SolicitarRecuperacaoSenhaUseCase(
      clienteRepository,
      tokenRepository,
      emailQueue,
    );
    await useCase.executar('ninguem@teste.com');

    expect(tokenRepository.criar).not.toHaveBeenCalled();
    expect(emailQueue.enfileirar).not.toHaveBeenCalled();
  });

  it('não gera token nem enfileira e-mail pra cliente sem senha (só existe do checkout de convidado)', async () => {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const emailQueue = criarEmailQueueMock();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock(false));

    const useCase = new SolicitarRecuperacaoSenhaUseCase(
      clienteRepository,
      tokenRepository,
      emailQueue,
    );
    await useCase.executar('maria@teste.com');

    expect(tokenRepository.criar).not.toHaveBeenCalled();
    expect(emailQueue.enfileirar).not.toHaveBeenCalled();
  });
});

describe('SolicitarCriacaoContaUseCase', () => {
  function montar() {
    const clienteRepository = criarClienteRepositoryMock();
    const tokenRepository = criarTokenRecuperacaoRepositoryMock();
    const emailQueue = criarEmailQueueMock();
    const useCase = new SolicitarCriacaoContaUseCase(
      clienteRepository,
      tokenRepository,
      emailQueue,
    );
    return { clienteRepository, tokenRepository, emailQueue, useCase };
  }

  it('e-mail novo: cria o cliente SEM senha e manda o link de ativação', async () => {
    const { clienteRepository, tokenRepository, emailQueue, useCase } = montar();
    clienteRepository.buscarPorEmail.mockResolvedValue(null);
    clienteRepository.criar.mockResolvedValue(criarClienteMock(false));

    await useCase.executar({ nome: 'Maria da Silva', email: 'maria@teste.com' });

    expect(clienteRepository.criar).toHaveBeenCalledWith(
      expect.not.objectContaining({ senhaHash: expect.anything() }),
    );
    expect(clienteRepository.atualizarSenha).not.toHaveBeenCalled();
    expect(tokenRepository.criar).toHaveBeenCalledWith(
      expect.objectContaining({ clienteId: 'cli-1' }),
    );
    expect(emailQueue.enfileirar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'ATIVACAO_CONTA', destinatario: 'maria@teste.com' }),
    );
  });

  it('convidado já existente: não define senha nem altera dados, só manda o link', async () => {
    const { clienteRepository, tokenRepository, emailQueue, useCase } = montar();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock(false));

    await useCase.executar({ nome: 'Invasor', email: 'maria@teste.com' });

    expect(clienteRepository.criar).not.toHaveBeenCalled();
    expect(clienteRepository.atualizar).not.toHaveBeenCalled();
    expect(clienteRepository.atualizarSenha).not.toHaveBeenCalled();
    expect(tokenRepository.invalidarValidosDoCliente).toHaveBeenCalledWith('cli-1');
    expect(emailQueue.enfileirar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'ATIVACAO_CONTA', nomeCliente: 'Maria da Silva' }),
    );
  });

  it('o link expira em 24 horas', async () => {
    const { clienteRepository, tokenRepository, useCase } = montar();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock(false));
    const antes = Date.now();

    await useCase.executar({ nome: 'Maria', email: 'maria@teste.com' });

    const { expiraEm } = tokenRepository.criar.mock.calls[0][0];
    const horas = (expiraEm.getTime() - antes) / 3_600_000;
    expect(horas).toBeGreaterThan(23.9);
    expect(horas).toBeLessThanOrEqual(24.01);
  });

  it('e-mail que já tem conta com senha: recusa e não manda nada', async () => {
    const { clienteRepository, tokenRepository, emailQueue, useCase } = montar();
    clienteRepository.buscarPorEmail.mockResolvedValue(criarClienteMock(true));

    await expect(useCase.executar({ nome: 'Invasor', email: 'maria@teste.com' })).rejects.toThrow(
      EmailJaCadastradoException,
    );
    expect(tokenRepository.criar).not.toHaveBeenCalled();
    expect(emailQueue.enfileirar).not.toHaveBeenCalled();
  });
});
