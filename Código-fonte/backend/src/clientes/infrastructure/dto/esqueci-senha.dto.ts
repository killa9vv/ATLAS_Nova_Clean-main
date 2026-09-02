import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EsqueciSenhaDto {
  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;
}
