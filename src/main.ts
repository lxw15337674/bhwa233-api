import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
async function bootstrap() {
  if (process.env.POSTGRES_USER) {
    new Logger('EnvironmentVariable').log('environment variable is set', process.env.POSTGRES_DATABASE);
  } else {
    new Logger('EnvironmentVariable').error('environment variable is not set');
    return
  }
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('工具文档')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);
  await app.listen(6060).then(() => {
    new Logger('NestApplication').log('Server is running ');
  });
}
bootstrap();
