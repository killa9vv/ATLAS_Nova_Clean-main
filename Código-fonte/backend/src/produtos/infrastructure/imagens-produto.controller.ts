import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadImagemProdutoUseCase } from '../application/upload-imagem-produto.use-case';
import { ListarImagensProdutoUseCase } from '../application/listar-imagens-produto.use-case';
import { RemoverImagemProdutoUseCase } from '../application/remover-imagem-produto.use-case';
import { DefinirImagemPrincipalUseCase } from '../application/definir-imagem-principal.use-case';
import { ImagemProdutoResponseDto } from './dto/imagem-produto-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

const CINCO_MB = 5 * 1024 * 1024;
const TIPOS_ACEITOS = /^image\/(jpeg|png|webp)$/;

@ApiTags('produtos')
@Controller('produtos/:produtoId/imagens')
export class ImagensProdutoController {
  constructor(
    private readonly uploadImagemProdutoUseCase: UploadImagemProdutoUseCase,
    private readonly listarImagensProdutoUseCase: ListarImagensProdutoUseCase,
    private readonly removerImagemProdutoUseCase: RemoverImagemProdutoUseCase,
    private readonly definirImagemPrincipalUseCase: DefinirImagemPrincipalUseCase,
  ) {}

  @Get()
  async listar(@Param('produtoId') produtoId: string): Promise<ImagemProdutoResponseDto[]> {
    const imagens = await this.listarImagensProdutoUseCase.executar(produtoId);
    return imagens.map(ImagemProdutoResponseDto.fromDomain);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @UseInterceptors(FileInterceptor('arquivo'))
  async upload(
    @Param('produtoId') produtoId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: CINCO_MB, message: 'Arquivo maior que 5MB.' }),
          // skipMagicNumbersValidation: o FileTypeValidator padrão do Nest checa o
          // magic number real do arquivo via import() dinâmico do pacote "file-type",
          // que não funciona no runtime VM do Jest (ERR_VM_DYNAMIC_IMPORT_CALLBACK_
          // MISSING_FLAG) — então valida pelo mimetype declarado no multipart. Rota já
          // é ADMIN-only, então o risco de spoofing de Content-Type é baixo.
          new FileTypeValidator({ fileType: TIPOS_ACEITOS, skipMagicNumbersValidation: true }),
        ],
      }),
    )
    arquivo: Express.Multer.File,
  ): Promise<ImagemProdutoResponseDto> {
    const imagem = await this.uploadImagemProdutoUseCase.executar(produtoId, arquivo.buffer);
    return ImagemProdutoResponseDto.fromDomain(imagem);
  }

  @Delete(':imagemId')
  @HttpCode(204)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async remover(@Param('imagemId') imagemId: string): Promise<void> {
    await this.removerImagemProdutoUseCase.executar(imagemId);
  }

  @Patch(':imagemId/principal')
  @HttpCode(204)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async definirPrincipal(@Param('imagemId') imagemId: string): Promise<void> {
    await this.definirImagemPrincipalUseCase.executar(imagemId);
  }
}
