import './instrument';
import 'reflect-metadata';
import { ValidationPipePtBr } from './shared/validation/validation-pipe-pt-br';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validarCorsOrigin } from './shared/config/validar-cors-origin';
import { GlobalExceptionFilter } from './shared/observability/global-exception.filter';
import { PinoLoggerService } from './shared/observability/pino-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  // Atrás do proxy do Render, sem isto todo visitante tem o mesmo IP e divide o mesmo limite
  // de requisições (ThrottlerGuard).
  app.set('trust proxy', 1);

  app.use(helmet());

  const corsOrigin = process.env.CORS_ORIGIN;
  validarCorsOrigin(corsOrigin, process.env.NODE_ENV);

  app.enableCors({
    origin: corsOrigin
      ? corsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipePtBr({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Atlas Nova Clean - API')
    .setDescription(
      'API do e-commerce Atlas Nova Clean: catalogo de produtos, carrinho, pedidos e pagamentos.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log({
    event: 'application_started',
    port,
  });
}

bootstrap();
