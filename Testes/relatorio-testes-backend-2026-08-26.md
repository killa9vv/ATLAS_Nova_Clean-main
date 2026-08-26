# Relatório de testes — backend

Gerado em 2026-08-26 com `npm run test:cov` (`Código-fonte/backend`). Este é um retrato
estático do momento em que foi gerado — para o resultado atual, rode o comando você mesmo
(ver [README.md](README.md)).

## Resumo

- **Suítes:** 17/17 passando
- **Testes:** 89/89 passando
- **Cobertura geral:** 43.13% statements / 46.23% branch / 44.96% funcs / 43.44% lines

## Saída completa

```

> atlas-nova-clean-backend@0.1.0 test:cov
> jest --coverage

PASS src/categorias/application/categorias.use-case.spec.ts (8.485 s)
PASS src/shared/config/env-validation.schema.spec.ts
PASS src/pagamentos/infrastructure/gateways/mercado-pago-webhook-signature.spec.ts
PASS src/shared/config/validar-cors-origin.spec.ts
[Nest] 18848  - 26/08/2026, 08:02:51   ERROR [ProcessarWebhookUseCase] Pagamento pag-1 do pedido pedido-1 foi aprovado pelo gateway, mas o estoque não está mais disponível (Estoque insuficiente para o produto "Detergente".). O pedido NÃO foi marcado como PAGO. Requer reconciliação manual — provavelmente estornar o cliente.
PASS src/pagamentos/application/processar-webhook.use-case.spec.ts (9.475 s)
PASS src/auth/domain/papel-usuario.enum.spec.ts
[Nest] 7004  - 26/08/2026, 08:02:51   ERROR [ReconciliarPagamentosPendentesUseCase] Falha ao reconciliar pagamento pag-1: gateway indisponível
PASS src/pagamentos/application/reconciliar-pagamentos-pendentes.use-case.spec.ts (9.56 s)
[Nest] 18848  - 26/08/2026, 08:02:51    WARN [ProcessarWebhookUseCase] Inconsistência detectada: pagamento pag-1 está APROVADO (sugere pedido PAGO), mas pedido pedido-1 já está em CANCELADO. Requer reconciliação manual.
[Nest] 7004  - 26/08/2026, 08:02:51     LOG [ReconciliarPagamentosPendentesUseCase] 2 pagamento(s) pendente(s) há mais de 30min — consultando o gateway.
[Nest] 7004  - 26/08/2026, 08:02:51    WARN [ReconciliarPagamentosPendentesUseCase] Pagamento pag-1 (pedido pedido-pag-1) foi atualizado pela reconciliação — o webhook original provavelmente se perdeu.
[Nest] 7004  - 26/08/2026, 08:02:51    WARN [ReconciliarPagamentosPendentesUseCase] Pagamento pag-2 (pedido pedido-pag-2) foi atualizado pela reconciliação — o webhook original provavelmente se perdeu.
[Nest] 7004  - 26/08/2026, 08:02:51     LOG [ReconciliarPagamentosPendentesUseCase] 2 pagamento(s) pendente(s) há mais de 30min — consultando o gateway.
[Nest] 7004  - 26/08/2026, 08:02:51    WARN [ReconciliarPagamentosPendentesUseCase] Pagamento pag-2 (pedido pedido-pag-2) foi atualizado pela reconciliação — o webhook original provavelmente se perdeu.
PASS src/marcas/application/marcas.use-case.spec.ts (9.444 s)
PASS src/pedidos/domain/pedidos.exceptions.spec.ts
PASS src/pedidos/domain/pedido.entity.spec.ts
PASS src/carrinho/application/montar-carrinho.use-case.spec.ts (9.743 s)
PASS src/produtos/infrastructure/prisma-produto.repository.spec.ts (9.811 s)
PASS src/produtos/application/produtos.use-case.spec.ts (9.924 s)
PASS src/pedidos/application/criar-pedido.use-case.spec.ts (9.953 s)
PASS src/pagamentos/infrastructure/gateways/mercado-pago-gateway.adapter.spec.ts (10.188 s)
PASS src/produtos/application/imagens-produto.use-case.spec.ts (10.161 s)
PASS src/pagamentos/infrastructure/pagamentos.controller.spec.ts (10.62 s)
[Nest] 7440  - 26/08/2026, 08:02:52    WARN [PagamentosController] MERCADOPAGO_WEBHOOK_SECRET não configurado — validação de assinatura desabilitada. Não usar em produção.
-----------------------------------------------|---------|----------|---------|---------|------------------------
File                                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s      
-----------------------------------------------|---------|----------|---------|---------|------------------------
All files                                      |   43.13 |    46.23 |   44.96 |   43.44 |                        
 src                                           |       0 |        0 |       0 |       0 |                        
  app.module.ts                                |       0 |      100 |     100 |       0 | 1-38                   
  main.ts                                      |       0 |        0 |       0 |       0 | 1-42                   
 src/auth/application                          |       0 |        0 |       0 |       0 |                        
  login.use-case.ts                            |       0 |        0 |       0 |       0 | 1-39                   
 src/auth/application/dto                      |       0 |      100 |     100 |       0 |                        
  login.dto.ts                                 |       0 |      100 |     100 |       0 | 1-12                   
 src/auth/domain                               |     100 |      100 |     100 |     100 |                        
  papel-usuario.enum.ts                        |     100 |      100 |     100 |     100 |                        
 src/auth/infrastructure                       |       0 |      100 |       0 |       0 |                        
  auth.controller.ts                           |       0 |      100 |       0 |       0 | 1-17                   
  auth.module.ts                               |       0 |      100 |     100 |       0 | 1-26                   
 src/auth/infrastructure/decorators            |       0 |      100 |       0 |       0 |                        
  roles.decorator.ts                           |       0 |      100 |       0 |       0 | 1-5                    
 src/auth/infrastructure/guards                |       0 |        0 |       0 |       0 |                        
  jwt-auth.guard.ts                            |       0 |      100 |     100 |       0 | 1-5                    
  roles.guard.ts                               |       0 |        0 |       0 |       0 | 1-22                   
 src/auth/infrastructure/strategies            |       0 |      100 |       0 |       0 |                        
  jwt.strategy.ts                              |       0 |      100 |       0 |       0 | 1-16                   
 src/carrinho/application                      |     100 |      100 |     100 |     100 |                        
  montar-carrinho.use-case.ts                  |     100 |      100 |     100 |     100 |                        
 src/carrinho/domain                           |     100 |      100 |     100 |     100 |                        
  carrinho.exceptions.ts                       |     100 |      100 |     100 |     100 |                        
  item-precificado.ts                          |     100 |      100 |     100 |     100 |                        
 src/carrinho/infrastructure                   |       0 |      100 |       0 |       0 |                        
  carrinho.controller.ts                       |       0 |      100 |       0 |       0 | 1-15                   
  carrinho.module.ts                           |       0 |      100 |     100 |       0 | 1-12                   
 src/carrinho/infrastructure/dto               |       0 |      100 |       0 |       0 |                        
  calcular-carrinho.dto.ts                     |       0 |      100 |       0 |       0 | 1-21                   
  carrinho-response.dto.ts                     |       0 |      100 |       0 |       0 | 1-38                   
 src/categorias/application                    |   97.87 |    66.66 |     100 |   97.43 |                        
  atualizar-categoria.use-case.ts              |     100 |      100 |     100 |     100 |                        
  criar-categoria.use-case.ts                  |     100 |      100 |     100 |     100 |                        
  excluir-categoria.use-case.ts                |    92.3 |       50 |     100 |    90.9 | 15                     
  listar-categorias.use-case.ts                |     100 |      100 |     100 |     100 |                        
 src/categorias/domain                         |     100 |      100 |     100 |     100 |                        
  categoria.entity.ts                          |     100 |      100 |     100 |     100 |                        
  categoria.repository.ts                      |     100 |      100 |     100 |     100 |                        
  categorias.exceptions.ts                     |     100 |      100 |     100 |     100 |                        
 src/categorias/infrastructure                 |       0 |        0 |       0 |       0 |                        
  categorias.controller.ts                     |       0 |      100 |       0 |       0 | 1-68                   
  categorias.module.ts                         |       0 |      100 |     100 |       0 | 1-21                   
  prisma-categoria.repository.ts               |       0 |        0 |       0 |       0 | 1-60                   
 src/categorias/infrastructure/dto             |       0 |      100 |       0 |       0 |                        
  atualizar-categoria.dto.ts                   |       0 |      100 |     100 |       0 | 1-9                    
  categoria-response.dto.ts                    |       0 |      100 |       0 |       0 | 1-19                   
  criar-categoria.dto.ts                       |       0 |      100 |     100 |       0 | 1-9                    
 src/marcas/application                        |   97.72 |    85.71 |     100 |   97.22 |                        
  atualizar-marca.use-case.ts                  |     100 |      100 |     100 |     100 |                        
  criar-marca.use-case.ts                      |     100 |      100 |     100 |     100 |                        
  excluir-marca.use-case.ts                    |    92.3 |       50 |     100 |    90.9 | 15                     
  listar-marcas.use-case.ts                    |     100 |      100 |     100 |     100 |                        
 src/marcas/domain                             |     100 |      100 |     100 |     100 |                        
  marca.entity.ts                              |     100 |      100 |     100 |     100 |                        
  marca.repository.ts                          |     100 |      100 |     100 |     100 |                        
  marcas.exceptions.ts                         |     100 |      100 |     100 |     100 |                        
 src/marcas/infrastructure                     |       0 |        0 |       0 |       0 |                        
  marcas.controller.ts                         |       0 |      100 |       0 |       0 | 1-68                   
  marcas.module.ts                             |       0 |      100 |     100 |       0 | 1-21                   
  prisma-marca.repository.ts                   |       0 |        0 |       0 |       0 | 1-48                   
 src/marcas/infrastructure/dto                 |       0 |      100 |       0 |       0 |                        
  atualizar-marca.dto.ts                       |       0 |      100 |     100 |       0 | 1-9                    
  criar-marca.dto.ts                           |       0 |      100 |     100 |       0 | 1-9                    
  marca-response.dto.ts                        |       0 |      100 |       0 |       0 | 1-15                   
 src/pagamentos/application                    |   81.81 |    48.27 |   83.33 |   80.76 |                        
  criar-pagamento.use-case.ts                  |    42.3 |        0 |       0 |    37.5 | 14-61                  
  processar-webhook.use-case.ts                |   91.93 |    78.57 |     100 |   91.66 | 83,88-91,95,161        
  reconciliar-pagamentos-pendentes.use-case.ts |     100 |       75 |     100 |     100 | 55                     
 src/pagamentos/domain                         |   94.73 |       75 |    87.5 |   94.73 |                        
  metodo-pagamento.enum.ts                     |     100 |      100 |     100 |     100 |                        
  pagamento.entity.ts                          |     100 |      100 |     100 |     100 |                        
  pagamento.repository.ts                      |     100 |      100 |     100 |     100 |                        
  pagamentos.exceptions.ts                     |    87.5 |       50 |      80 |    87.5 | 20-23                  
  payment-gateway.port.ts                      |     100 |      100 |     100 |     100 |                        
  status-pagamento.enum.ts                     |     100 |      100 |     100 |     100 |                        
 src/pagamentos/infrastructure                 |   34.48 |    38.09 |   15.38 |   35.89 |                        
  pagamentos.controller.ts                     |    90.9 |       80 |   66.66 |   90.32 | 33-41,79               
  pagamentos.module.ts                         |       0 |      100 |     100 |       0 | 1-27                   
  prisma-pagamento.repository.ts               |       0 |        0 |       0 |       0 | 1-85                   
  reconciliacao-pagamentos.scheduler.ts        |       0 |        0 |       0 |       0 | 1-21                   
 src/pagamentos/infrastructure/dto             |    72.5 |      100 |       0 |    72.5 |                        
  criar-pagamento.dto.ts                       |   78.94 |      100 |       0 |   78.94 | 43,50,55,64            
  pagamento-response.dto.ts                    |      50 |      100 |       0 |      50 | 18-23                  
  webhook-mercadopago.dto.ts                   |   88.88 |      100 |       0 |   88.88 | 25                     
 src/pagamentos/infrastructure/gateways        |   88.57 |    59.52 |     100 |   88.23 |                        
  mercado-pago-gateway.adapter.ts              |    97.5 |     64.7 |     100 |   97.36 | 122                    
  mercado-pago-status.mapper.ts                |      50 |    30.76 |     100 |      50 | 23,28-35               
  mercado-pago-webhook-signature.ts            |   94.44 |    83.33 |     100 |   94.44 | 39                     
 src/pedidos/application                       |      56 |       75 |      60 |      55 |                        
  buscar-pedido-por-id.use-case.ts             |       0 |        0 |       0 |       0 | 1-15                   
  criar-pedido.use-case.ts                     |     100 |      100 |     100 |     100 |                        
 src/pedidos/domain                            |     100 |      100 |     100 |     100 |                        
  pedido.entity.ts                             |     100 |      100 |     100 |     100 |                        
  pedido.repository.ts                         |     100 |      100 |     100 |     100 |                        
  pedidos.exceptions.ts                        |     100 |      100 |     100 |     100 |                        
  status-pedido.enum.ts                        |     100 |      100 |     100 |     100 |                        
 src/pedidos/infrastructure                    |       0 |        0 |       0 |       0 |                        
  pedidos.controller.ts                        |       0 |      100 |       0 |       0 | 1-39                   
  pedidos.module.ts                            |       0 |      100 |     100 |       0 | 1-20                   
  prisma-pedido.repository.ts                  |       0 |        0 |       0 |       0 | 1-76                   
 src/pedidos/infrastructure/dto                |       0 |      100 |       0 |       0 |                        
  criar-pedido.dto.ts                          |       0 |      100 |       0 |       0 | 1-21                   
  pedido-response.dto.ts                       |       0 |      100 |       0 |       0 | 1-47                   
 src/produtos/application                      |   83.08 |    72.22 |   83.33 |   83.47 |                        
  alternar-status-produto.use-case.ts          |     100 |      100 |     100 |     100 |                        
  atualizar-produto.use-case.ts                |      96 |    85.71 |     100 |   95.45 | 15                     
  buscar-produto-por-id.use-case.ts            |       0 |        0 |       0 |       0 | 1-15                   
  buscar-produto-por-slug.use-case.ts          |       0 |        0 |       0 |       0 | 1-15                   
  criar-produto.use-case.ts                    |     100 |       50 |     100 |     100 | 18                     
  definir-imagem-principal.use-case.ts         |     100 |      100 |     100 |     100 |                        
  listar-imagens-produto.use-case.ts           |     100 |      100 |     100 |     100 |                        
  listar-produtos.use-case.ts                  |     100 |       50 |     100 |     100 | 16                     
  remover-imagem-produto.use-case.ts           |     100 |      100 |     100 |     100 |                        
  upload-imagem-produto.use-case.ts            |     100 |      100 |     100 |     100 |                        
 src/produtos/domain                           |     100 |      100 |     100 |     100 |                        
  image-storage.port.ts                        |     100 |      100 |     100 |     100 |                        
  imagem-produto.entity.ts                     |     100 |      100 |     100 |     100 |                        
  imagem-produto.repository.ts                 |     100 |      100 |     100 |     100 |                        
  produto.entity.ts                            |     100 |      100 |     100 |     100 |                        
  produto.repository.ts                        |     100 |      100 |     100 |     100 |                        
  produtos.exceptions.ts                       |     100 |      100 |     100 |     100 |                        
 src/produtos/infrastructure                   |    9.13 |     3.84 |    8.69 |    8.42 |                        
  cloudinary-storage.adapter.ts                |       0 |        0 |       0 |       0 | 1-34                   
  imagens-produto.controller.ts                |       0 |      100 |       0 |       0 | 1-89                   
  prisma-imagem-produto.repository.ts          |       0 |        0 |       0 |       0 | 1-67                   
  prisma-produto.repository.ts                 |   33.33 |     6.25 |   22.22 |    32.6 | 26-112,134-135,141-158 
  produtos.controller.ts                       |       0 |      100 |       0 |       0 | 1-85                   
  produtos.module.ts                           |       0 |      100 |     100 |       0 | 1-40                   
 src/produtos/infrastructure/dto               |       0 |      100 |       0 |       0 |                        
  atualizar-produto.dto.ts                     |       0 |      100 |     100 |       0 | 1-4                    
  criar-produto.dto.ts                         |       0 |      100 |     100 |       0 | 1-30                   
  imagem-produto-response.dto.ts               |       0 |      100 |       0 |       0 | 1-40                   
  listar-produtos-query.dto.ts                 |       0 |      100 |       0 |       0 | 1-47                   
  produto-paginado-response.dto.ts             |       0 |      100 |       0 |       0 | 1-29                   
  produto-response.dto.ts                      |       0 |      100 |       0 |       0 | 1-39                   
 src/shared                                    |     100 |      100 |     100 |     100 |                        
  slug.util.ts                                 |     100 |      100 |     100 |     100 |                        
 src/shared/config                             |     100 |      100 |     100 |     100 |                        
  env-validation.schema.ts                     |     100 |      100 |     100 |     100 |                        
  validar-cors-origin.ts                       |     100 |      100 |     100 |     100 |                        
 src/shared/exceptions                         |      20 |        0 |   33.33 |   21.42 |                        
  domain-exception.filter.ts                   |       0 |        0 |       0 |       0 | 1-41                   
  domain.exception.ts                          |     100 |      100 |     100 |     100 |                        
 src/shared/prisma                             |      24 |      100 |       0 |   22.22 |                        
  prisma-transaction-manager.ts                |       0 |      100 |       0 |       0 | 1-12                   
  prisma.module.ts                             |       0 |      100 |     100 |       0 | 1-11                   
  prisma.service.ts                            |   71.42 |      100 |       0 |      60 | 7-11                   
  transaction-manager.ts                       |     100 |      100 |     100 |     100 |                        
-----------------------------------------------|---------|----------|---------|---------|------------------------

Test Suites: 17 passed, 17 total
Tests:       89 passed, 89 total
Snapshots:   0 total
Time:        29.819 s
Ran all test suites.
```
