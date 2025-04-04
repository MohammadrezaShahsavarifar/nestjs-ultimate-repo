# دکوراتور RateLimit

دکوراتور `RateLimit` برای محدود کردن تعداد درخواست‌های ارسالی به یک اندپوینت در یک بازه زمانی مشخص استفاده می‌شود. این دکوراتور می‌تواند برای جلوگیری از حملات DoS (Denial of Service) و محافظت از منابع سرور مفید باشد.

## نصب

این دکوراتور بخشی از پکیج `core` است و نیازی به نصب جداگانه ندارد.

## استفاده پایه

```typescript
import { Controller, Get } from '@nestjs/common';
import { RateLimit } from '../../packages/core/decorators/rate-limit.decorator';

@Controller('users')
export class UserController {
  @Get()
  @RateLimit({ max: 10, windowMs: 60 * 1000 }) // محدودیت به 10 درخواست در دقیقه
  findAll() {
    return this.userService.findAll();
  }
}