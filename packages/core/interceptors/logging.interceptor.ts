import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const userId = user?.id;
    
    const now = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${method} ${url} ${userId ? `- User: ${userId}` : ''} - ${Date.now() - now}ms`,
        );
      }),
    );
  }
}