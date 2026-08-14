// Sobe/derruba o PostgreSQL local usado em desenvolvimento. Ver scripts/postgres.mjs.
import { criarInstanciaPostgres, subirPostgres } from './postgres.mjs';

const pg = criarInstanciaPostgres();
const comando = process.argv[2];

if (comando === 'stop') {
  await pg.stop();
  console.log('Postgres local parado.');
  process.exit(0);
}

await subirPostgres(pg);

if (comando !== 'keep-alive') {
  process.exit(0);
}
