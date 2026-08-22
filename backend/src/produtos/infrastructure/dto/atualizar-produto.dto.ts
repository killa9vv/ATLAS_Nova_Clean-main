import { PartialType } from '@nestjs/mapped-types';
import { CriarProdutoDto } from './criar-produto.dto';

export class AtualizarProdutoDto extends PartialType(CriarProdutoDto) {}
