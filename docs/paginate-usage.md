# راهنمای استفاده از دکوراتور Paginate

دکوراتور `@Paginate()` یک راه‌حل ساده و قدرتمند برای پیاده‌سازی صفحه‌بندی در API‌های NestJS است. این دکوراتور به صورت خودکار صفحه‌بندی را برای لیست‌ها مدیریت می‌کند.

## نصب و راه‌اندازی

برای استفاده از این دکوراتور، ابتدا باید `PaginationInterceptor` را در ماژول اصلی برنامه ثبت کنید:

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PaginationInterceptor } from './packages/core/interceptors/pagination.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PaginationInterceptor,
    },
  ],
})
export class AppModule {}