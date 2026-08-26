// Sobe o Postgres local e a API NestJS juntos, numa aba só. Ctrl+C encerra os dois.
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { criarInstanciaPostgres, subirPostgres } from './postgres.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raizDoBackend = path.resolve(__dirname, '..');

const pg = criarInstanciaPostgres();
await subirPostgres(pg);

const api = spawn('npx', ['nest', 'start', '--watch'], {
  cwd: raizDoBackend,
  stdio: 'inherit',
  shell: true,
});

let encerrando = false;
async function encerrar() {
  if (encerrando) return;
  encerrando = true;
  api.kill();
  await pg.stop();
  process.exit(0);
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
api.on('exit', encerrar);
