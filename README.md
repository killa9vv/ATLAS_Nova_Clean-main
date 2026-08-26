# Atlas Nova Clean

E-commerce de produtos de limpeza e papelaria, com checkout via Pix e cartão pelo Mercado Pago.

> **Status:** em desenvolvimento. Ainda não opera em produção — ver [limitações conhecidas](#limitações-conhecidas).

## Stack

| Camada | Tecnologias |
|---|---|
| Back-end | NestJS, TypeScript, Prisma, PostgreSQL |
| Front-end | HTML, CSS e JavaScript (ES modules), sem framework |
| Pagamentos | Mercado Pago — Payment Brick (Pix e cartão de crédito) |

## Estrutura

Organização do repositório para a disciplina, separando código-fonte de outros artefatos do
projeto (documentação, banco de dados, protótipos, testes, apresentação):

```
.
├── Documentação/            # Atas, auditorias e documentação do projeto
├── Código-fonte/
│   ├── atlas-nova-clean-loja/   # Vitrine e checkout (estático)
│   │   ├── js/                  # Carrinho, catálogo, integração de pagamento
│   │   ├── css/
│   │   └── assets/
│   ├── backend/              # API NestJS
│   │   ├── src/
│   │   │   ├── produtos/     # Catálogo
│   │   │   ├── carrinho/     # Precificação e validação de itens
│   │   │   ├── pedidos/      # Criação e ciclo de vida do pedido
│   │   │   ├── pagamentos/   # Integração Mercado Pago e webhook
│   │   │   └── shared/       # Prisma e tratamento de exceções
│   │   └── prisma/           # Schema e migrations
│   └── frontend/             # Nova vitrine em desenvolvimento (Next.js)
├── Banco de Dados/           # Referência ao schema/migrations (ver README próprio)
├── Protótipos/                # Wireframes e mockups
├── Testes/                    # Como e onde rodar os testes automatizados
└── Apresentação/               # Slides e material de apresentação
```

## Arquitetura

Cada módulo do back-end segue a mesma divisão em três camadas, com a dependência sempre apontando para dentro:

- **`domain/`** — entidades, enums, exceções e interfaces de repositório. Sem dependência de framework ou banco.
- **`application/`** — casos de uso. Orquestram o domínio e dependem apenas de abstrações.
- **`infrastructure/`** — controllers, DTOs, implementações Prisma e adaptadores de gateway.

O gateway de pagamento é abstraído pela porta `PaymentGateway` no domínio, com o Mercado Pago como adaptador na infraestrutura. Trocar de provedor não exige alterar nenhum caso de uso.

Duas invariantes deliberadas:

- **O preço nunca vem do cliente.** `MontarCarrinhoUseCase` sempre recarrega os produtos do banco e recalcula o total.
- **O item do pedido guarda snapshot** de nome e preço unitário, para que alterações no catálogo não modifiquem pedidos já realizados.

## Rodando localmente

Requisitos: Node.js 20+, Docker (para o Postgres local).

```bash
cd Código-fonte/backend
npm install
cp .env.example .env          # preencha DATABASE_URL e as chaves do Mercado Pago
npx prisma migrate deploy
npm run prisma:seed           # popula o catálogo
npm run dev                   # sobe Postgres e API juntos
```

A vitrine é estática — sirva a pasta `Código-fonte/atlas-nova-clean-loja/` com qualquer servidor HTTP:

```bash
npx serve Código-fonte/atlas-nova-clean-loja
```

Instruções detalhadas e o checklist de produção do Mercado Pago estão em
[`Código-fonte/backend/README.md`](Código-fonte/backend/README.md).

## Testes

```bash
cd Código-fonte/backend
npm test
```

Ver [`Testes/README.md`](Testes/README.md) para o panorama completo (unitários, e2e e frontend).

## Limitações conhecidas

Documentado abertamente porque o projeto ainda não está pronto para receber pagamentos reais:

- **O estoque só é reservado na confirmação do pagamento, não no checkout.** A criação do pedido (`CriarPedidoUseCase`) apenas valida disponibilidade em leitura, pra dar feedback rápido ao cliente — não reserva nada. O decremento de verdade acontece em `ReconciliarPedidoService` (`TransactionManager` + UPDATE condicional `estoque >= quantidade`, testado sob concorrência real em `test/pagamentos-webhook.e2e-spec.ts`), compartilhado pelos dois jeitos de um pagamento se confirmar: síncrono (cartão, que o gateway já aprova/recusa na resposta de `POST /pagamentos`) ou assíncrono (Pix, via `ProcessarWebhookUseCase` quando a notificação chega). Decisão deliberada: como não há reserva no checkout, dois pedidos podem ser criados pro mesmo último item — só um consegue confirmar o pagamento; o outro fica registrado como anomalia (pagamento aprovado, sem estoque) pra reconciliação manual, tipicamente estorno ao cliente. O estoque é devolvido automaticamente quando um pedido pago vai a `ESTORNADO`; pedidos cancelados antes de pagar não têm o que devolver, já que nunca chegaram a reservar nada.
- **A validação de assinatura do webhook é obrigatória em produção.** Sem `MERCADOPAGO_WEBHOOK_SECRET`, a aplicação rejeita a requisição (`401`) quando `NODE_ENV=production`; fora de produção, apenas registra um aviso e aceita (conveniência de dev).
- **O job de reconciliação de pagamentos perdidos roda a cada 10 minutos** (`ReconciliacaoPagamentosScheduler`) e reconsulta no gateway todo pagamento pendente há mais de 30 minutos — cobre o caso do webhook nunca chegar. Ainda não é configurável por ambiente (intervalo e janela são constantes no código).
- **Não há transição de estados validada de forma genérica** para o pedido (só a proteção específica contra sobrescrever um status final, com a exceção deliberada de `PAGO → ESTORNADO`), nem cálculo de frete, autenticação de cliente, painel administrativo ou e-mails transacionais.
