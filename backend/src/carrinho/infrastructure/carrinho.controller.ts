// Endpoint HTTP para calcular o carrinho (preview de preços e total) a partir dos itens solicitados.
import { Body, Controller, Post } from '@nestjs/common';
import { MontarCarrinhoUseCase } from '../application/montar-carrinho.use-case';
import { CalcularCarrinhoDto } from './dto/calcular-carrinho.dto';
import { CarrinhoResponseDto } from './dto/carrinho-response.dto';

@Controller('carrinho')
export class CarrinhoController {
  constructor(private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase) {}

  @Post('calcular')
  async calcular(@Body() dto: CalcularCarrinhoDto): Promise<CarrinhoResponseDto> {
    const carrinho = await this.montarCarrinhoUseCase.executar(dto.itens);
    return CarrinhoResponseDto.fromDomain(carrinho);
  }
}
