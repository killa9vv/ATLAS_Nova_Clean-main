import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { traduzirMensagemValidacao } from './traduzir-mensagem-validacao';

/**
 * Mesmo ValidationPipe do Nest (mesma forma de resposta: lista de mensagens com o
 * caminho do campo), só que com as mensagens padrão do class-validator traduzidas
 * pra português. Registrado globalmente em main.ts.
 */
export class ValidationPipePtBr extends ValidationPipe {
  createExceptionFactory() {
    return (validationErrors: ValidationError[] = []) =>
      new BadRequestException(
        this.flattenValidationErrors(validationErrors).map(traduzirMensagemValidacao),
      );
  }
}
