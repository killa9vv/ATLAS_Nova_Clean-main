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

export async function subirPostgres(pg) {
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
