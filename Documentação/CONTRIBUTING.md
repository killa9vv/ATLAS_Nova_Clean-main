# Contribuindo

## Fluxo de branches

Trunk-based, simples: `main` é sempre deployável. Trabalho novo vai em `feature/nome-da-coisa`
(ou `fix/nome-do-bug`), aberto como Pull Request contra `main`. Sem branch `develop` — o CI
(lint, typecheck, testes) roda em todo PR e é o que garante que `main` fica estável, não uma
branch de integração separada.

```bash
git checkout -b feature/nome-da-coisa
# ... commits ...
git push -u origin feature/nome-da-coisa
# abrir PR contra main
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), verificado automaticamente pelo
Husky (`commit-msg`) via commitlint:

```
<tipo>(<escopo opcional>): <descrição>
```

Tipos usados no projeto: `feat`, `fix`, `chore`, `test`, `docs`, `refactor`. Exemplos reais do
histórico:

```
fix(backend): protege rotas de escrita com guards e corrige default inseguro de papel
feat(auth): implementa login JWT, roles ADMIN/CLIENTE e guards de autorizacao
test(produtos): add use-case tests for produtos module
```

## Antes de abrir o PR

- `npm test` e `npm run test:e2e` no `Código-fonte/backend/` (o e2e sobe um Postgres embarcado,
  não precisa de Docker nem de configuração extra)
- `npm run lint` no `Código-fonte/backend/` e no `Código-fonte/frontend/`, conforme o que você mudou
- Se mexeu no `schema.prisma`, revise a migration gerada manualmente antes de commitar —
  `npx prisma migrate dev` gera o SQL, mas a revisão é sua responsabilidade

O CI (`.github/workflows/ci.yml`) roda tudo isso de novo no PR — pense nesses passos locais como
um jeito de pegar problema antes, não como uma etapa opcional.
