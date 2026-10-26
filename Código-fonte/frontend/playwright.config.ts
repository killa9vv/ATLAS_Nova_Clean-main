import { defineConfig, devices } from '@playwright/test';

// Mesma porta de sempre (3001, ver README) — o Next 16 recusa subir um segundo dev
// server pro mesmo projeto em outra porta (lock por diretório, não por porta), então
// reusar a instância já rodando é o caminho certo, não inventar uma porta isolada.
const PORTA = 3001;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- -p ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
