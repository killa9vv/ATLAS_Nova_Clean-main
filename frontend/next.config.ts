import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // O repo tem outro package-lock.json na raiz (tooling de git hooks, fora
  // deste projeto) — sem isso o Next tenta adivinhar a raiz do workspace e
  // erra para o diretório pai.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
