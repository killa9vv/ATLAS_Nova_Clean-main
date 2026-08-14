// Sobe um Postgres embarcado dedicado e efêmero para a suíte e2e: diretório,
// porta e credenciais separados do Postgres de desenvolvimento (scripts/dev-db.mjs),
// pra nunca colidir nem compartilhar dados com ele. Roda as migrations nele e
// publica a DATABASE_URL em process.env antes do Jest subir os workers de teste
// (é assim que os testes enxergam essa variável).
import path from 'path';
import { execSync } from 'child_process';

const DATABASE_DIR = path.resolve(__dirname, '../../.pgdata-test');
const PORT = 5434;
const DATABASE_URL = `postgresql://atlas_test:atlas_test@localhost:${PORT}/atlas_nova_clean_test`;

export default async function globalSetup(): Promise<void> {
  // embedded-postgres é ESM-only; em um projeto CommonJS só dá pra carregar via import() dinâmico.
  const { default: EmbeddedPostgres } = await import('embedded-postgres');

  const pg = new EmbeddedPostgres({
    databaseDir: DATABASE_DIR,
    user: 'atlas_test',
    password: 'atlas_test',
    port: PORT,
    // Efêmero: stop() apaga o diretório de dados, garantindo banco limpo a cada rodada.
    persistent: false,
  });

  await pg.initialise();
  await pg.start();
  await pg.createDatabase('atlas_nova_clean_test');

  process.env.DATABASE_URL = DATABASE_URL;

  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
  });

  // globalSetup e globalTeardown rodam no mesmo processo Jest — usamos essa
  // referência global pra parar exatamente esta instância na hora de derrubar.
  (globalThis as unknown as { __ATLAS_TEST_PG__?: unknown }).__ATLAS_TEST_PG__ = pg;
}
