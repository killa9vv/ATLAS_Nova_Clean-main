# Testes

Os testes automatizados vivem junto do código que testam (convenção padrão de Jest/NestJS e
Next.js), para rodar no mesmo pipeline de build. Este diretório reúne o resumo do que existe e
como executar.

## Onde estão

- **Backend** — unitários (`*.spec.ts` ao lado de cada caso de uso, em
  [`Código-fonte/backend/src`](../Código-fonte/backend/src)) e e2e
  (em [`Código-fonte/backend/test`](../Código-fonte/backend/test), sobem um Postgres embarcado).
- **Frontend** — testes de componente em
  [`Código-fonte/frontend/src`](../Código-fonte/frontend/src).

## Como rodar

```bash
# Backend — unitários + cobertura
cd Código-fonte/backend
npm run test:cov

# Backend — e2e (Postgres embarcado, sem Docker)
npm run test:e2e

# Frontend
cd Código-fonte/frontend
npm test
```

O CI (`.github/workflows/ci.yml`) roda os mesmos comandos em todo push/PR para `main`.

## Relatório

[`relatorio-testes-backend-2026-08-26.md`](relatorio-testes-backend-2026-08-26.md) — snapshot da
saída de `npm run test:cov` nessa data (17 suítes / 89 testes passando, cobertura por arquivo).
É um retrato estático, não atualiza sozinho — rode o comando acima para o resultado atual.
