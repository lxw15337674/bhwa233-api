import { AllMiddleware } from './all/all.middleware';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(AllMiddleware);
  await app.listen(6060);
}
bootstrap();
