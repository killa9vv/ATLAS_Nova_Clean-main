# ERD — Atlas Nova Clean

Diagrama gerado a partir de `schema.prisma`. Atualize este arquivo (e
`schema.dbml`) junto de qualquer mudança de schema — nenhum dos dois é gerado
automaticamente no build.

Pra visualizar no [dbdiagram.io](https://dbdiagram.io): cole o conteúdo de
[`schema.dbml`](schema.dbml) lá. O Mermaid abaixo é a versão que renderiza
direto no repo/GitHub.

> O Mermaid abaixo cobre só o fluxo principal (catálogo → carrinho → pedido →
> pagamento) pra não virar um diagrama ilegível. Tabelas mais novas/auxiliares
> (`RegraAtacado`, `CupomCategoria`/`CupomProduto`/`CupomUsoCliente`, `Banner`,
> `PedidoStatusHistorico`, `PedidoNumeroSequencial`, `TokenRecuperacaoSenha`,
> `RefreshToken`, `EmailEnviado`, `Resenha`) não estão desenhadas aqui — o
> `schema.dbml`/`schema.prisma` são a fonte completa.

```mermaid
erDiagram
    CATEGORIA ||--o{ PRODUTO_TIPO : "possui"
    PRODUTO_TIPO ||--o{ PRODUTO : "possui variantes"
    MARCA ||--o{ PRODUTO : "fabrica"
    PRODUTO ||--o{ IMAGEM_PRODUTO : "possui"
    PRODUTO ||--o{ MOVIMENTACAO_ESTOQUE : "registra"
    CLIENTE ||--o{ ENDERECO : "possui"
    CLIENTE |o--o{ PEDIDO : "faz (opcional)"
    CLIENTE |o--o{ CARRINHO : "possui (opcional)"
    CARRINHO ||--o{ ITEM_CARRINHO : "contém"
    PRODUTO ||--o{ ITEM_CARRINHO : "referenciado em"
    PRODUTO ||--o{ ITEM_PEDIDO : "referenciado em"
    PEDIDO ||--o{ ITEM_PEDIDO : "contém"
    PEDIDO ||--o{ PAGAMENTO : "possui"
    CUPOM |o--o{ PEDIDO : "aplicado em (opcional)"
    CUPOM |o--o{ CARRINHO : "aplicado em (opcional)"

    CATEGORIA {
        string id PK
        string slug UK
        string nome
        datetime created_at
        datetime updated_at
    }
    MARCA {
        string id PK
        string nome UK
        datetime created_at
        datetime updated_at
    }
    PRODUTO_TIPO {
        string id PK
        string categoria_id FK
        string nome
        string info_tecnica "nullable"
        string precaucoes "nullable"
        datetime created_at
        datetime updated_at
    }
    PRODUTO {
        string id PK
        string produto_tipo_id FK
        string marca_id FK
        string nome
        string pack
        string descricao "nullable"
        decimal preco
        int estoque
    }
    IMAGEM_PRODUTO {
        string id PK
        string produto_id FK
        string url
        int ordem
    }
    MOVIMENTACAO_ESTOQUE {
        string id PK
        string produto_id FK
        enum tipo "ENTRADA | SAIDA | AJUSTE"
        int quantidade
        string motivo "nullable"
    }
    USUARIO {
        string id PK
        string email UK
        string senha_hash
        string nome
        enum papel "ADMIN"
    }
    CLIENTE {
        string id PK
        string nome
        string email UK "nullable"
        string telefone "nullable"
        string cpf "nullable"
        string cnpj "nullable"
        datetime created_at
        datetime updated_at
    }
    ENDERECO {
        string id PK
        string cliente_id FK
        string cep
        string logradouro
        string numero
        string complemento "nullable"
        string bairro
        string cidade
        string estado
        boolean padrao
        datetime created_at
        datetime updated_at
    }
    CUPOM {
        string id PK
        string codigo UK
        enum tipo_desconto "PERCENTUAL | VALOR_FIXO"
        decimal valor
        boolean ativo
        datetime valido_ate "nullable"
        int uso_maximo "nullable"
        int usos_count
        decimal valor_minimo_pedido "nullable"
        int limite_uso_por_cliente "nullable"
    }
    CARRINHO {
        string id PK
        string cliente_id FK "nullable — convidado"
        string session_token UK
        string cupom_codigo FK "nullable"
        datetime expira_em "nullable"
    }
    ITEM_CARRINHO {
        string id PK
        string carrinho_id FK
        string produto_id FK
        int quantidade
    }
    PEDIDO {
        string id PK
        string cliente_id FK "nullable — convidado"
        enum status
        decimal total
        decimal desconto "soma atacado + cupom, sem breakdown"
        string cupom_codigo FK "nullable"
    }
    ITEM_PEDIDO {
        string id PK
        string pedido_id FK
        string produto_id FK
        string nome "snapshot"
        int quantidade
        decimal preco_unitario "snapshot"
    }
    PAGAMENTO {
        string id PK
        string pedido_id FK
        enum metodo "PIX | CARTAO_CREDITO"
        enum status
        decimal valor
        string gateway_transaction_id UK "nullable"
    }
```

## Decisões que valem registrar

- **`Usuario` não tem relação com nenhuma outra tabela ainda.** É só a conta de
  login pro futuro painel administrativo (`papel` hoje só tem `ADMIN`, de
  propósito — expande quando a carta de Auth tiver requisito real). Não é a
  mesma coisa que `Cliente`: `Cliente` é o perfil de quem compra (sem senha,
  criado até em pedido de convidado); `Usuario` é quem faz login.
- **`Pedido.cupomCodigo`/`Carrinho.cupomCodigo` são FK de verdade pra
  `Cupom.codigo`** (não um snapshot solto — isso mudou desde a modelagem
  original; ver nota antiga abaixo do porquê era diferente). `onDelete: SetNull`
  em `Pedido` e comportamento padrão (bloqueia delete) em `Carrinho` — ou seja,
  **não dá pra apagar um `Cupom` que já foi usado em algum carrinho ativo**,
  só desativá-lo (`ativo = false`). Igual `RegraAtacado`, isso é modelagem de
  desconto (referência viva), diferente do snapshot de preço em `ItemPedido`
  (que existe pra nota fiscal/histórico não mudar se o produto mudar depois).
  A FK aponta pro `codigo` (chave de negócio), não pelo `id`, porque é assim
  que o cliente/admin se referem ao cupom — o endpoint de edição
  (`AtualizarCupomUseCase`) bloqueia editar `codigo` de propósito, exatamente
  pra essa FK nunca precisar mudar de valor debaixo de um pedido já criado.
- **`Endereco` existe mas `Pedido` não aponta pra ele ainda.** Como o pedido
  guarda endereço de entrega (snapshot? FK? os dois?) é decisão de fluxo de
  checkout que fica pra carta "Clientes, endereços e cálculo de frete".
- **`ProdutoTipo.info_tecnica`/`precaucoes`** são só o texto padrão por tipo —
  o catálogo do frontend também prevê uma sobreposição por variante
  individual (`ProductVariant.info`/`precautions`), mas nenhum produto real
  usa isso hoje, então não tem coluna equivalente em `Produto`.
- **`Carrinho`/`ItemCarrinho` não têm snapshot de preço** (ao contrário de
  `ItemPedido`) — de propósito. Um carrinho é uma referência viva ao catálogo
  atual; o preço cobrado de verdade é sempre recalculado no servidor
  (`MontarCarrinhoUseCase`) na hora da compra, nunca confiando no que está
  salvo no carrinho. `Carrinho` é identificado por `session_token` (guardado
  no cliente — cookie/localStorage), com `cliente_id` opcional pra quando o
  comprador for conhecido — não depende de login existir.
- **`MovimentacaoEstoque` é só o ledger (tabela), sem nenhuma escrita
  automática ainda.** `decrementarEstoque` continua sendo a única coisa que
  de fato altera `Produto.estoque`; popular esse histórico a cada
  entrada/saída é trabalho de aplicação de uma carta futura.
- **Migration `20260915120000_organizacao_indices_cascade_timestamps`** —
  lote de organização sem mudança de comportamento: índice em `tokenHash`
  (`RefreshToken`/`TokenRecuperacaoSenha`, evita scan sequencial no
  login/refresh), `ItemCarrinho → Carrinho` virou `ON DELETE CASCADE` (antes
  `LimpezaCarrinhosScheduler` tinha que apagar os itens manualmente numa
  transação pra não violar a FK), índice composto `(status, createdAt)` em
  `Pedido` pra suportar o filtro do painel admin, CHECK constraint garantindo
  o XOR `produtoId`/`categoriaId` em `RegraAtacado`, e `createdAt`/`updatedAt`
  em `Categoria`/`Marca`/`ProdutoTipo`/`Endereco` (e `updatedAt` em `Cliente`),
  que não tinham nenhum timestamp — inconsistente com o resto do schema.
