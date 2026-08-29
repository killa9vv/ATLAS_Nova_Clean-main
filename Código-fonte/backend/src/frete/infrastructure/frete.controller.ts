import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CalcularFreteUseCase } from '../application/calcular-frete.use-case';
import { CalcularFreteDto } from './dto/calcular-frete.dto';
import { FreteResponseDto } from './dto/frete-response.dto';

@ApiTags('frete')
@Controller('frete')
export class FreteController {
  constructor(private readonly calcularFreteUseCase: CalcularFreteUseCase) {}

  @Post('cotacao')
  async cotar(@Body() dto: CalcularFreteDto): Promise<FreteResponseDto> {
    const resultado = await this.calcularFreteUseCase.executar(dto);
    return FreteResponseDto.fromDomain(resultado);
  }
}
