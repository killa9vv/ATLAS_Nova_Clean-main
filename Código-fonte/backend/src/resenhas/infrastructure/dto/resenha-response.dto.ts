import { ApiProperty } from '@nestjs/swagger';
import { Resenha } from '../../domain/resenha.entity';

export class ResenhaResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id!: string;

  @ApiProperty({ example: 'Maria da Silva' })
  nome!: string;

  @ApiProperty({ example: 5 })
  nota!: number;

  @ApiProperty({ example: 'Atendimento rápido e produtos de qualidade.' })
  comentario!: string;

  @ApiProperty({ example: '2026-08-22T18:30:00.000Z' })
  createdAt!: Date;

  static fromDomain(resenha: Resenha): ResenhaResponseDto {
    const dto = new ResenhaResponseDto();
    dto.id = resenha.id;
    dto.nome = resenha.nome;
    dto.nota = resenha.nota;
    dto.comentario = resenha.comentario;
    dto.createdAt = resenha.createdAt;
    return dto;
  }
}
