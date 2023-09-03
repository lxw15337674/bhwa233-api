export function AllMiddleware(req: any, res: any, next: any) {
  console.log('我是全局中间件.....');
  next();
}
