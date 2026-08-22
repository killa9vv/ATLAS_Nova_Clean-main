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

```
.
├── atlas-nova-clean-loja/   # Vitrine e checkout (estático)
│   ├── js/                  # Carrinho, catálogo, integração de pagamento
│   ├── css/
│   └── assets/
└── backend/                 # API NestJS
    ├── src/
    │   ├── produtos/        # Catálogo
    │   ├── carrinho/        # Precificação e validação de itens
    │   ├── pedidos/         # Criação e ciclo de vida do pedido
    │   ├── pagamentos/      # Integração Mercado Pago e webhook
    │   └── shared/          # Prisma e tratamento de exceções
    └── prisma/              # Schema e migrations
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
cd backend
npm install
cp .env.example .env          # preencha DATABASE_URL e as chaves do Mercado Pago
npx prisma migrate deploy
npm run prisma:seed           # popula o catálogo
npm run dev                   # sobe Postgres e API juntos
```

A vitrine é estática — sirva a pasta `atlas-nova-clean-loja/` com qualquer servidor HTTP:

```bash
npx serve atlas-nova-clean-loja
```

Instruções detalhadas e o checklist de produção do Mercado Pago estão em [`backend/README.md`](backend/README.md).

## Testes

```bash
cd backend
npm test
```

## Limitações conhecidas

Documentado abertamente porque o projeto ainda não está pronto para receber pagamentos reais:

- **O estoque não é decrementado.** Nenhum fluxo escreve em `Produto.estoque` — a verificação em `MontarCarrinhoUseCase` é apenas leitura. O mesmo item pode ser vendido indefinidamente.
- **Sem transações.** Criação de pedido e validação de estoque acontecem em queries separadas, sem `$transaction`.
- **A idempotência do webhook tem janela de corrida.** A checagem compara o status atual com o consultado; notificações concorrentes podem processar em duplicidade.
- **A validação de assinatura do webhook é opcional.** Sem `MERCADOPAGO_WEBHOOK_SECRET`, a aplicação apenas registra um aviso e aceita a requisição.
- **Não há transição de estados validada** para o pedido, nem cálculo de frete, autenticação, painel administrativo ou e-mails transacionais.
