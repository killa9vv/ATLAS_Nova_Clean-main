// Garante migrations aplicadas, catálogo populado e um admin — chamado por
// postgres.mjs toda vez que o Postgres local (dev.mjs/dev-db.mjs) sobe. Cada passo só
// faz trabalho de verdade quando falta algo (idempotente), então não pesa no dia a dia:
// resolve o caso de "mergeei uma migration nova" ou "zerei o .pgdata" sem precisar
// lembrar de rodar nada manualmente.
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raizDoBackend = path.resolve(__dirname, '..');

// Mesmo custo usado em create-admin.mjs — consistente em todo o app.
const CUSTO_HASH_SENHA = 12;

function rodar(cmd, args) {
  const resultado = spawnSync(cmd, args, { cwd: raizDoBackend, stdio: 'inherit', shell: true });
  if (resultado.status !== 0) {
    throw new Error(`Comando falhou (status ${resultado.status}): ${cmd} ${args.join(' ')}`);
  }
}

export async function bootstrapBancoDev() {
  rodar('npx', ['prisma', 'migrate', 'deploy']);

  const prisma = new PrismaClient();
  try {
    const categorias = await prisma.categoria.count();
    if (categorias === 0) {
      console.log('Catálogo vazio — populando (npx prisma db seed)...');
      rodar('npx', ['prisma', 'db', 'seed']);
    }

    const admins = await prisma.usuario.count({ where: { papel: 'ADMIN' } });
    if (admins === 0) {
      // ADMIN_EMAIL/ADMIN_SENHA no .env (nunca versionado) escolhem as credenciais;
      // sem eles, cai num default só de dev — dá pra sempre logar sem decorar nada.
      const email = process.env.ADMIN_EMAIL || 'admin@atlas.local';
      const senha = process.env.ADMIN_SENHA || 'admin12345';
      const nome = process.env.ADMIN_NOME || 'Admin';
      const senhaHash = await bcrypt.hash(senha, CUSTO_HASH_SENHA);
      await prisma.usuario.create({ data: { email, senhaHash, nome, papel: 'ADMIN' } });
      console.log(
        `Nenhum admin encontrado — criado ${email} (defina ADMIN_EMAIL/ADMIN_SENHA no .env pra escolher outra credencial).`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}
