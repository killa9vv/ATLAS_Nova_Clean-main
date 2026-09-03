import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ClienteAutenticadoDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id!: string;

  @ApiProperty({ example: 'Maria da Silva' })
  nome!: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  email?: string;
}

export class LoginClienteResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: ClienteAutenticadoDto })
  cliente!: ClienteAutenticadoDto;
}

export class RenovarTokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}
