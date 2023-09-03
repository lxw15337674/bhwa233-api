import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';

function MiddleWareAll(req: any, res: any, next: any) {
  console.log('我是全局中间件.....');
  // res.send('禁止访问')
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cors());
  app.use(MiddleWareAll);
  await app.listen(6060);
}
bootstrap();
