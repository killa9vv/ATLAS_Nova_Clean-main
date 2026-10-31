// Helpers compartilhados pelos e2e que precisam de um Cliente com login.
//
// "Criar conta" não define senha (ver SolicitarCriacaoContaUseCase): manda um link
// de ativação por e-mail e a senha é escolhida em POST /auth/clientes/redefinir-senha
// com o token do link. Os e2e não sobem Redis nem Resend, então EmailQueuePort é
// trocado por este fake, que só guarda as tarefas — o resto do fluxo (registro,
// tokens no banco, definição de senha, login) roda de verdade contra a API/DB.
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EmailQueuePort } from '../../src/emails/domain/email-queue.port';
import { TarefaEmail } from '../../src/emails/domain/tarefa-email';

type TarefaComToken = Extract<TarefaEmail, { token: string }>;

export class FakeEmailQueue extends EmailQueuePort {
  tarefas: TarefaEmail[] = [];

  async enfileirar(tarefa: TarefaEmail): Promise<void> {
    this.tarefas.push(tarefa);
  }

  /** Token da tarefa mais recente desse tipo pra esse destinatário (o backend grava
   * e-mails em minúsculas — ver NormalizarEmail — então compara sem diferenciar). */
  tokenPara(tipo: TarefaComToken['tipo'], destinatario: string): string | undefined {
    const alvo = destinatario.toLowerCase();
    const tarefa = [...this.tarefas]
      .reverse()
      .find(
        (t): t is TarefaComToken =>
          t.tipo === tipo && 'destinatario' in t && t.destinatario.toLowerCase() === alvo,
      );
    return tarefa?.token;
  }
}

/** Registra e ativa uma conta (escolhe a senha pelo token do e-mail de ativação). */
export async function criarContaAtivada(
  app: INestApplication,
  fila: FakeEmailQueue,
  dados: { nome: string; email: string; senha: string },
): Promise<void> {
  await request(app.getHttpServer())
    .post('/auth/clientes/registrar')
    .send({ nome: dados.nome, email: dados.email })
    .expect(200);

  const token = fila.tokenPara('ATIVACAO_CONTA', dados.email);
  if (!token) {
    throw new Error(`Nenhum e-mail de ativação enfileirado pra ${dados.email}`);
  }

  await request(app.getHttpServer())
    .post('/auth/clientes/redefinir-senha')
    .send({ token, novaSenha: dados.senha })
    .expect(204);
}
