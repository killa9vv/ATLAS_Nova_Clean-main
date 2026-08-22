import { PartialType } from '@nestjs/swagger';
import { CriarProdutoDto } from './criar-produto.dto';

export class AtualizarProdutoDto extends PartialType(CriarProdutoDto) {}
