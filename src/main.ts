import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.setGlobalPrefix('api');
  await app.listen(6060).then(() => {
    new Logger('NestApplication').log('Server is running ');
  });
}
bootstrap();
