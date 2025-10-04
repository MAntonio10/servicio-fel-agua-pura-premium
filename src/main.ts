import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // Permite todas las origins en desarrollo
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  const host = process.env.HOST ?? 'localhost';

  await app.listen(port, host);
  console.log(`Servidor ejecutándose en http://${host}:${port}`);
}
bootstrap();
