import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MontarCarrinhoUseCase } from '../application/montar-carrinho.use-case';
import { CalcularCarrinhoDto } from './dto/calcular-carrinho.dto';
import { CarrinhoResponseDto } from './dto/carrinho-response.dto';

@ApiTags('carrinho')
@Controller('carrinho')
export class CarrinhoController {
  constructor(private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase) {}

  @Post('calcular')
  async calcular(@Body() dto: CalcularCarrinhoDto): Promise<CarrinhoResponseDto> {
    const carrinho = await this.montarCarrinhoUseCase.executar(dto.itens);
    return CarrinhoResponseDto.fromDomain(carrinho);
  }
}
