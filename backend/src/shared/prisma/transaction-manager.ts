/**
 * Porta para executar operações de mais de um repositório como uma única transação
 * atômica (tudo ou nada). O contexto devolvido pro callback é opaco pro domínio/aplicação
 * — só a implementação concreta (Prisma) sabe o que fazer com ele — e deve ser repassado
 * como último argumento pros métodos de repositório que aceitam um contexto de transação.
 */
export abstract class TransactionManager {
  abstract executar<T>(fn: (contexto: unknown) => Promise<T>): Promise<T>;
}
