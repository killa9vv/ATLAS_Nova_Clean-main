import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorageAdapter } from './cloudinary-storage.adapter';

jest.mock('cloudinary', () => ({
  v2: { config: jest.fn(), uploader: { upload_stream: jest.fn(), destroy: jest.fn() } },
}));

const uploadStream = cloudinary.uploader.upload_stream as unknown as jest.Mock;

type Callback = (erro: unknown, resultado?: unknown) => void;

// Simula o upload_stream: responde com erro ou sucesso conforme a chamada.
function responderCom(...respostas: Array<'erro' | 'ok'>) {
  let chamada = 0;
  uploadStream.mockImplementation((_opcoes: unknown, callback: Callback) => {
    const resposta = respostas[chamada++];
    const { PassThrough } = jest.requireActual<typeof import('stream')>('stream');
    const stream = new PassThrough();
    stream.on('finish', () =>
      resposta === 'erro'
        ? callback(new Error('Background removal quota exceeded'))
        : callback(undefined, { secure_url: 'https://res.cloudinary.com/x.jpg', public_id: 'x' }),
    );
    stream.resume();
    return stream;
  });
}

function criarAdapter(removerFundo?: string) {
  const config = {
    get: (chave: string) => (chave === 'CLOUDINARY_REMOVER_FUNDO' ? removerFundo : 'valor'),
  } as unknown as ConfigService;
  return new CloudinaryStorageAdapter(config);
}

describe('CloudinaryStorageAdapter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('por padrão envia pedindo remoção de fundo', async () => {
    responderCom('ok');

    const resultado = await criarAdapter().upload(Buffer.from('foto'), 'produtos');

    expect(resultado).toEqual({ url: 'https://res.cloudinary.com/x.jpg', providerId: 'x' });
    expect(uploadStream.mock.calls[0][0]).toEqual({
      folder: 'produtos',
      background_removal: 'cloudinary_ai',
    });
  });

  it('se a remoção de fundo falhar (ex.: cota esgotada), envia de novo sem ela', async () => {
    responderCom('erro', 'ok');

    const resultado = await criarAdapter().upload(Buffer.from('foto'), 'produtos');

    expect(resultado.providerId).toBe('x');
    expect(uploadStream).toHaveBeenCalledTimes(2);
    expect(uploadStream.mock.calls[1][0]).toEqual({ folder: 'produtos' });
  });

  it('CLOUDINARY_REMOVER_FUNDO=false envia direto sem remoção de fundo', async () => {
    responderCom('ok');

    await criarAdapter('false').upload(Buffer.from('foto'), 'produtos');

    expect(uploadStream).toHaveBeenCalledTimes(1);
    expect(uploadStream.mock.calls[0][0]).toEqual({ folder: 'produtos' });
  });

  it('se o envio sem remoção também falhar, o erro sobe', async () => {
    responderCom('erro', 'erro');

    await expect(criarAdapter().upload(Buffer.from('foto'), 'produtos')).rejects.toThrow();
  });
});
