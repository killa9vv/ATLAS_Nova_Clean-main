import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class MensagemChatDto {
  @IsIn(['cliente', 'assistente'])
  papel!: 'cliente' | 'assistente';

  // Folgado de propósito: fala do assistente é maior que a do cliente. O limite de quanto
  // histórico vai pro modelo fica em ResponderAtendimentoUseCase.
  @IsString()
  @Length(1, 4000)
  texto!: string;
}

export class ChatAtendimentoDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => MensagemChatDto)
  mensagens!: MensagemChatDto[];
}
