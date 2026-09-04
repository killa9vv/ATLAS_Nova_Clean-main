import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class AdicionarItemCarrinhoDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  @IsString()
  produtoId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;
}
