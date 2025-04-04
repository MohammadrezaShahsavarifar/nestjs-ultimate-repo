# دکوراتور @Sanitize

دکوراتور `@Sanitize` برای پاکسازی داده‌های ورودی در درخواست‌های API و جلوگیری از حملات XSS و سایر مشکلات امنیتی طراحی شده است. این راهنما نحوه استفاده از این دکوراتور را در پروژه‌های NestJS توضیح می‌دهد.

## راه‌اندازی

دکوراتور `@Sanitize` و فایل‌های مرتبط با آن در مسیر `packages/core` قرار دارند. برای استفاده از آن، مطمئن شوید که `SanitizeInterceptor` در ماژول شما ارائه شده است:

```typescript
import { Module } from '@nestjs/common';
import { SanitizeInterceptor } from '../packages/core/interceptors/sanitize.interceptor';

@Module({
  providers: [SanitizeInterceptor],
})
export class AppModule {}