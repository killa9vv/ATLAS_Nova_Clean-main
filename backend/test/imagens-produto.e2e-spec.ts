// Teste e2e do upload de imagens contra Postgres real. O storage é um dublê em memória
// (nunca fala com o Cloudinary de verdade) — o que importa provar aqui é o fluxo HTTP
// completo: guard de admin, validação de arquivo, persistência e a troca de imagem
// principal, não a integração externa em si.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';
import { ImageStorage, ResultadoUploadImagem } from '../src/produtos/domain/image-storage.port';

// Conteúdo não precisa ser um PNG de verdade: a validação de tipo do endpoint usa o
// mimetype declarado no multipart (ver comentário em imagens-produto.controller.ts).
const CONTEUDO_FAKE_PNG = Buffer.from('conteúdo fake — só o Content-Type importa aqui');

class StorageDeTeste implements ImageStorage {
  private contador = 0;
  removidos: string[] = [];

  async upload(): Promise<ResultadoUploadImagem> {
    this.contador++;
    const providerId = `fake-${this.contador}`;
    // Formato similar ao do Cloudinary (.../upload/.../<public_id>.jpg) — o DTO de
    // resposta insere a transformação de thumbnail logo após "/upload/".
    return { url: `https://fake-storage/image/upload/v1/${providerId}.jpg`, providerId };
  }

  async remover(providerId: string): Promise<void> {
    this.removidos.push(providerId);
  }
}

describe('Imagens de produto (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let storage: StorageDeTeste;
  let tokenAdmin: string;
  let produtoId: string;

  beforeAll(async () => {
    storage = new StorageDeTeste();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ImageStorage)
      .useValue(storage)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);
    const jwtService = moduleRef.get(JwtService);
    tokenAdmin = jwtService.sign({ sub: randomUUID(), email: 'admin@teste.com', papel: 'ADMIN' });

    const produto = await prisma.produto.create({
      data: {
        id: randomUUID(),
        nome: `Produto com imagens ${randomUUID()}`,
        slug: `produto-com-imagens-${randomUUID()}`,
        preco: 10,
        estoque: 5,
      },
    });
    produtoId = produto.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita upload sem token (401)', async () => {
    await request(app.getHttpServer())
      .post(`/produtos/${produtoId}/imagens`)
      .attach('arquivo', Buffer.from('conteudo-fake'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      })
      .expect(401);
  });

  it('rejeita arquivo de tipo não permitido (400)', async () => {
    await request(app.getHttpServer())
      .post(`/produtos/${produtoId}/imagens`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('arquivo', Buffer.from('não é uma imagem'), {
        filename: 'arquivo.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('faz upload, lista, define principal e remove imagens do produto', async () => {
    const respostaUpload1 = await request(app.getHttpServer())
      .post(`/produtos/${produtoId}/imagens`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('arquivo', CONTEUDO_FAKE_PNG, { filename: 'foto1.png', contentType: 'image/png' })
      .expect(201);

    expect(respostaUpload1.body.ordem).toBe(0);
    expect(respostaUpload1.body.principal).toBe(true);
    expect(respostaUpload1.body.thumbnailUrl).toContain('w_300,h_300');

    const respostaUpload2 = await request(app.getHttpServer())
      .post(`/produtos/${produtoId}/imagens`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('arquivo', CONTEUDO_FAKE_PNG, { filename: 'foto2.png', contentType: 'image/png' })
      .expect(201);

    expect(respostaUpload2.body.ordem).toBe(1);
    expect(respostaUpload2.body.principal).toBe(false);

    const respostaListagem = await request(app.getHttpServer())
      .get(`/produtos/${produtoId}/imagens`)
      .expect(200);
    expect(respostaListagem.body).toHaveLength(2);
    expect(respostaListagem.body[0].id).toBe(respostaUpload1.body.id);

    // Promove a segunda imagem a principal — deve trocar de lugar com a primeira.
    await request(app.getHttpServer())
      .patch(`/produtos/${produtoId}/imagens/${respostaUpload2.body.id}/principal`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(204);

    const respostaAposTroca = await request(app.getHttpServer())
      .get(`/produtos/${produtoId}/imagens`)
      .expect(200);
    const novaPrincipal = respostaAposTroca.body.find(
      (img: { principal: boolean }) => img.principal,
    );
    expect(novaPrincipal.id).toBe(respostaUpload2.body.id);

    await request(app.getHttpServer())
      .delete(`/produtos/${produtoId}/imagens/${respostaUpload1.body.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(204);

    expect(storage.removidos).toHaveLength(1);

    const respostaFinal = await request(app.getHttpServer())
      .get(`/produtos/${produtoId}/imagens`)
      .expect(200);
    expect(respostaFinal.body).toHaveLength(1);
  });

  it('rejeita upload pra produto inexistente (404)', async () => {
    const resposta = await request(app.getHttpServer())
      .post(`/produtos/${randomUUID()}/imagens`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .attach('arquivo', CONTEUDO_FAKE_PNG, { filename: 'foto.png', contentType: 'image/png' })
      .expect(404);

    expect(resposta.body.erro).toBe('PRODUTO_NAO_ENCONTRADO');
  });
});
