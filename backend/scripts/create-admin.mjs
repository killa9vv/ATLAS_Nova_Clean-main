// Cria (ou atualiza a senha de) um Usuario com papel ADMIN. É script, não rota HTTP,
// de propósito: não existe hoje nenhum fluxo de cadastro na API, e expor "criar admin"
// como endpoint seria abrir uma porta de escalação de privilégio pra qualquer um.
//
// Uso:
//   ADMIN_EMAIL=voce@atlas.com ADMIN_SENHA="senha-forte-aqui" node scripts/create-admin.mjs
//
// Opcional: ADMIN_NOME (default "Admin").
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const CUSTOS_HASH = 12;

const email = process.env.ADMIN_EMAIL;
const senha = process.env.ADMIN_SENHA;
const nome = process.env.ADMIN_NOME ?? 'Admin';

if (!email || !senha) {
  console.error('Defina ADMIN_EMAIL e ADMIN_SENHA nas variáveis de ambiente antes de rodar.');
  console.error('Exemplo: ADMIN_EMAIL=voce@atlas.com ADMIN_SENHA="senha-forte-aqui" node scripts/create-admin.mjs');
  process.exit(1);
}

if (senha.length < 8) {
  console.error('ADMIN_SENHA precisa ter pelo menos 8 caracteres.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash(senha, CUSTOS_HASH);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { senhaHash, papel: 'ADMIN' },
    create: { email, senhaHash, nome, papel: 'ADMIN' },
  });

  console.log(`Usuario admin pronto: ${usuario.email} (id ${usuario.id}).`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
