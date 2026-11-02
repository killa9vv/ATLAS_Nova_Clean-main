import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmarTrocaEmailDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
