import { createApp } from '../src/main';

export default async function handler(req: any, res: any) {
  const app = await createApp();
  await app.init();
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}