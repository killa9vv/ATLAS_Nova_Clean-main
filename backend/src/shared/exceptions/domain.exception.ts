// Classe base para exceções de domínio — cada subclasse define um `code` estável,
// traduzido para status HTTP pelo DomainExceptionFilter.
export abstract class DomainException extends Error {
  abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
