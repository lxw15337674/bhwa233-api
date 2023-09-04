import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cors());
  await app.listen(6060).then(() => {
    new Logger('NestApplication').log(
      'Server is running on http://localhost:6060',
    );
  });
}
bootstrap();
