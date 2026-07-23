import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './observability/app-logger.service';
import { MetricsService } from './observability/metrics.service';
import { createObservabilityMiddleware } from './observability/observability.middleware';

async function bootstrap() {
  // bufferLogs difiere los logs de arranque hasta que se instala el logger.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Logger estructurado en JSON y observabilidad (request-id + métricas).
  app.useLogger(app.get(AppLogger));
  app.use(createObservabilityMiddleware(app.get(MetricsService)));

  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN ?? '*',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Equipos Microservice')
    .setDescription(
      'API de gestión de equipos, miembros, invitaciones, partidos y estadísticas de Noob Stats',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3002);
}
void bootstrap();
