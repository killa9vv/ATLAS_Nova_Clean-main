import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';
import { OptionalJwtAuthGuard } from '../../auth/presentation/guards/optional-jwt-auth.guard';
import { ResponderAtendimentoUseCase } from '../application/responder-atendimento.use-case';
import { EventoAtendimento } from '../domain/evento-atendimento';
import { ModeloAtendimento } from '../domain/modelo-atendimento';
import { ChatAtendimentoDto } from './dto/chat-atendimento.dto';

const MENSAGEM_ERRO =
  'Tive um problema para responder agora. Tente de novo ou fale com a loja pelo WhatsApp.';
const MENSAGENS_POR_MINUTO = 12;

// Público: quem está logado só ganha a consulta aos próprios pedidos. Admin não conta como
// cliente, mesmo com token válido.
@ApiTags('atendimento')
@Controller('atendimento')
export class AtendimentoController {
  private readonly logger = new Logger(AtendimentoController.name);

  constructor(
    private readonly modelo: ModeloAtendimento,
    private readonly responderAtendimento: ResponderAtendimentoUseCase,
  ) {}

  @Get('status')
  status(): { ativo: boolean } {
    return { ativo: this.modelo.estaDisponivel() };
  }

  /** Resposta em Server-Sent Events, uma linha `data:` com JSON por EventoAtendimento. */
  @Post('chat')
  @HttpCode(200)
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: MENSAGENS_POR_MINUTO, ttl: 60_000 } })
  async chat(
    @Body() dto: ChatAtendimentoDto,
    @Req() req: Request & { user?: { id: string; papel: string } },
    @Res() res: Response,
  ): Promise<void> {
    if (!this.modelo.estaDisponivel()) {
      throw new ServiceUnavailableException('Atendimento indisponível no momento.');
    }
    if (dto.mensagens[dto.mensagens.length - 1].papel !== 'cliente') {
      throw new BadRequestException('A última mensagem precisa ser do cliente.');
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Cliente fechou o chat no meio: para de gerar, e de gastar, na mesma hora.
    const cancelamento = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) cancelamento.abort();
    });
    const emitir = (evento: EventoAtendimento) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(evento)}\n\n`);
    };

    try {
      await this.responderAtendimento.executar(
        {
          mensagens: dto.mensagens,
          clienteId: req.user?.papel === PapelUsuario.CLIENTE ? req.user.id : undefined,
        },
        emitir,
        cancelamento.signal,
      );
    } catch (erro) {
      if (!cancelamento.signal.aborted) {
        this.logger.error({
          mensagem: 'falha no atendimento',
          erro: erro instanceof Error ? erro.message : String(erro),
        });
        emitir({ tipo: 'erro', mensagem: MENSAGEM_ERRO });
      }
    }
    emitir({ tipo: 'fim' });
    res.end();
  }
}
