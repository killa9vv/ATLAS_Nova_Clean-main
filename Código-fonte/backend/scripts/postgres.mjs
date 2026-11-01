// Helper compartilhado por dev-db.mjs e dev.mjs pra subir o PostgreSQL local
// embarcado (binário embarcado, sem precisar instalar nada no sistema nem de
// root). Não usar em produção — lá, aponte DATABASE_URL para um Postgres de
// verdade (Railway, RDS, etc.).
import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { bootstrapBancoDev } from './db-bootstrap.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const databaseDir = path.resolve(__dirname, '../.pgdata');

export function criarInstanciaPostgres() {
  return new EmbeddedPostgres({
    databaseDir,
    user: 'atlas',
    password: 'atlas',
    port: 5433,
    persistent: true,
  });
}

// Hosts que contam como "banco de desenvolvimento". `postgres` é o nome do serviço
// no docker-compose.
const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'postgres']);

/**
 * Trava de segurança: `npm run dev` roda `prisma migrate deploy` + seed e sobe a API
 * contra o DATABASE_URL — se a janela do terminal ainda tiver um DATABASE_URL de
 * produção definido à mão (ex.: `$env:DATABASE_URL = ...` pra rodar create-admin),
 * ele passa por cima do .env e tudo isso iria pro banco real, sem revisão. Aqui só
 * olha a variável do terminal (o .env é lido depois, pelo Prisma/Nest).
 */
export function garantirBancoLocal() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return; // formato estranho — deixa o Prisma reclamar com a mensagem dele
  }

  if (!HOSTS_LOCAIS.has(host)) {
    console.error(
      [
        '',
        `PARADO: esta janela do terminal está com DATABASE_URL apontando pra "${host}",`,
        'que não é o banco local. O "npm run dev" aplicaria migrations e rodaria a API',
        'contra esse banco (provavelmente o de produção).',
        '',
        'Feche este terminal e abra outro (ou rode: Remove-Item Env:DATABASE_URL no',
        'PowerShell / unset DATABASE_URL no bash) e tente de novo.',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }
}

export async function subirPostgres(pg) {
  garantirBancoLocal();

  const jaInicializado = fs.existsSync(path.join(databaseDir, 'PG_VERSION'));
  if (!jaInicializado) {
    console.log('Inicializando cluster Postgres local em', databaseDir);
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase('atlas_nova_clean');
  } catch {
    // já existe de uma execução anterior — segue o jogo
  }

  console.log('Postgres local rodando em postgresql://atlas:atlas@localhost:5433/atlas_nova_clean');

  await bootstrapBancoDev();
}
