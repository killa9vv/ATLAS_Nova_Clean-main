// Endpoints HTTP de pagamentos: criação de pagamento e recebimento do webhook
// do Mercado Pago (com validação de assinatura).
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Query,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CriarPagamentoUseCase } from '../application/criar-pagamento.use-case';
import { ProcessarWebhookUseCase } from '../application/processar-webhook.use-case';
import { CriarPagamentoDto } from './dto/criar-pagamento.dto';
import { PagamentoResponseDto } from './dto/pagamento-response.dto';
import { WebhookMercadoPagoDto } from './dto/webhook-mercadopago.dto';
import { validarAssinaturaWebhookMercadoPago } from './gateways/mercado-pago-webhook-signature';

@Controller('pagamentos')
export class PagamentosController {
  private readonly logger = new Logger(PagamentosController.name);

  constructor(
    private readonly criarPagamentoUseCase: CriarPagamentoUseCase,
    private readonly processarWebhookUseCase: ProcessarWebhookUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async criar(@Body() dto: CriarPagamentoDto): Promise<PagamentoResponseDto> {
    const resultado = await this.criarPagamentoUseCase.executar({
      pedidoId: dto.pedidoId,
      metodo: dto.metodo,
      pagador: dto.pagador,
      tokenCartao: dto.tokenCartao,
      parcelas: dto.parcelas,
      metodoPagamentoId: dto.metodoPagamentoId,
    });
    return PagamentoResponseDto.fromOutput(resultado);
  }

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body() body: WebhookMercadoPagoDto,
    @Query('data.id') dataIdQuery: string | undefined,
    @Headers('x-signature') xSignature: string | undefined,
    @Headers('x-request-id') xRequestId: string | undefined,
  ): Promise<{ recebido: boolean }> {
    const dataId = body.data?.id ?? dataIdQuery;

    const secret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (secret) {
      const assinaturaValida = validarAssinaturaWebhookMercadoPago({
        xSignature,
        xRequestId,
        dataId,
        secret,
      });
      if (!assinaturaValida) {
        throw new UnauthorizedException('Assinatura do webhook inválida.');
      }
    } else {
      this.logger.warn(
        'MERCADOPAGO_WEBHOOK_SECRET não configurado — validação de assinatura desabilitada. Não usar em produção.',
      );
    }

    if (body.type !== 'payment' || !dataId) {
      return { recebido: true };
    }

    await this.processarWebhookUseCase.executar(dataId);
    return { recebido: true };
  }
}
