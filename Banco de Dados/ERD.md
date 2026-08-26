# ERD — Atlas Nova Clean

Diagrama gerado a partir de `schema.prisma`. Atualize este arquivo (e
`schema.dbml`) junto de qualquer mudança de schema — nenhum dos dois é gerado
automaticamente no build.

Pra visualizar no [dbdiagram.io](https://dbdiagram.io): cole o conteúdo de
[`schema.dbml`](schema.dbml) lá. O Mermaid abaixo é a versão que renderiza
direto no repo/GitHub.

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

    CATEGORIA {
        string id PK
        string slug UK
        string nome
    }
    MARCA {
        string id PK
        string nome UK
    }
    PRODUTO_TIPO {
        string id PK
        string categoria_id FK
        string nome
        string info_tecnica "nullable"
        string precaucoes "nullable"
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
    }
    CARRINHO {
        string id PK
        string cliente_id FK "nullable — convidado"
        string session_token UK
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
        decimal desconto
        string cupom_codigo "snapshot, nullable, não é FK"
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
- **`Cupom` não tem FK saindo de `Pedido`.** `Pedido.cupomCodigo` é um
  snapshot (texto solto), igual `ItemPedido.nome`/`ItemPedido.precoUnitario` —
  se o cupom for editado ou apagado depois, o pedido já feito não muda. Por
  isso não existe seta `CUPOM ||--o{ PEDIDO` no diagrama, apesar de parecer
  que devia.
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
