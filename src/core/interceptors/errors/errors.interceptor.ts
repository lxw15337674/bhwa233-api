import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, map } from 'rxjs';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(
        catchError((error) => {
          if (error instanceof HttpException) {
            return Promise.resolve({
              code: error.getStatus(),
              message: error.getResponse(),
            });
          }
          new Logger('ErrorsInterceptor').error(error.toString());
          return Promise.resolve({
            code: 500,
            message: `出现了意外错误：${error.toString()}`,
          });
        }),
      )
      .pipe(
        map((data) => {
          return {
            code: 200,
            message: '查询成功',
            data,
          };
        }),
      );
  }
}
