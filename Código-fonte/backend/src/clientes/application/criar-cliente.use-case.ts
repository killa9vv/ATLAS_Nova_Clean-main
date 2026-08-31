import { Injectable } from '@nestjs/common';
import { validarCnpj, validarCpf } from '../../shared/documento.util';
import { Cliente } from '../domain/cliente.entity';
import { ClienteRepository } from '../domain/cliente.repository';
import { DocumentoInvalidoException } from '../domain/clientes.exceptions';

export interface CriarClienteInput {
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
}

@Injectable()
export class CriarClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async executar(input: CriarClienteInput): Promise<Cliente> {
    validarDocumentos(input.cpf, input.cnpj);

    // "Criar" aqui é efetivamente um upsert por e-mail: o checkout público (guest
    // marcando "salvar meus dados") chama esse endpoint de novo a cada compra, sempre
    // com o mesmo e-mail — sem isso, a segunda compra do mesmo cliente quebraria com
    // violação de unique constraint em vez de simplesmente reaproveitar o cadastro.
    if (input.email) {
      const existente = await this.clienteRepository.buscarPorEmail(input.email);
      if (existente) {
        return existente;
      }
    }

    return this.clienteRepository.criar({
      nome: input.nome,
      email: input.email,
      telefone: input.telefone,
      cpf: input.cpf,
      cnpj: input.cnpj,
    });
  }
}

/**
 * Cliente tem CPF (pessoa física, B2C) OU CNPJ (pessoa jurídica, B2B) — nunca os
 * dois, e o formato precisa ter dígito verificador válido, não só a quantidade
 * certa de dígitos. Compartilhado por criação e atualização.
 */
export function validarDocumentos(cpf?: string, cnpj?: string): void {
  if (cpf && cnpj) {
    throw new DocumentoInvalidoException(
      'Informe apenas um dos documentos: CPF ou CNPJ, não os dois.',
    );
  }
  if (cpf && !validarCpf(cpf)) {
    throw new DocumentoInvalidoException(`CPF "${cpf}" é inválido.`);
  }
  if (cnpj && !validarCnpj(cnpj)) {
    throw new DocumentoInvalidoException(`CNPJ "${cnpj}" é inválido.`);
  }
}
