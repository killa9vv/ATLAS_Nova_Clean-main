import { OmitType } from '@nestjs/swagger';
import { AtualizarClienteDto } from './atualizar-cliente.dto';

/** PATCH /clientes/me: o e-mail fica de fora, só muda com confirmação (POST /clientes/me/email). */
export class AtualizarMeuPerfilDto extends OmitType(AtualizarClienteDto, ['email'] as const) {}
