// وارد کردن توابع و کلاس‌های مورد نیاز از NestJS
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
// وارد کردن گارد محدودیت نرخ درخواست و اینترفیس تنظیمات آن
import { RateLimitGuard, RateLimitOptions } from '../guards/rate-limit.guard';

/**
 * دکوراتور RateLimit برای محدود کردن تعداد درخواست‌ها به یک اندپوینت
 * 
 * این دکوراتور را می‌توان روی متدهای کنترلر استفاده کرد تا تعداد درخواست‌ها به آن متد محدود شود.
 * 
 * @param options تنظیمات محدودیت نرخ درخواست
 * @returns دکوراتور ترکیبی
 * 
 * @example
 * // محدودیت به 5 درخواست در دقیقه
 * @RateLimit({ max: 5, windowMs: 60 * 1000 })
 * async findAll() {
 *   return this.userService.findAll();
 * }
 * 
 * @example
 * // محدودیت به 10 درخواست در ساعت با پیام خطای سفارشی
 * @RateLimit({ 
 *   max: 10, 
 *   windowMs: 60 * 60 * 1000,
 *   message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
 * })
 * async createUser() {
 *   // ...
 * }
 */
// تعریف تابع دکوراتور RateLimit
// این تابع یک آبجکت تنظیمات را دریافت می‌کند و یک دکوراتور ترکیبی برمی‌گرداند
export function RateLimit(options: RateLimitOptions = {}) {
  // استفاده از applyDecorators برای ترکیب چند دکوراتور
  return applyDecorators(
    // ذخیره تنظیمات در متادیتا با کلید 'rateLimit'
    SetMetadata('rateLimit', options),
    // استفاده از گارد محدودیت نرخ درخواست
    UseGuards(RateLimitGuard),
  );
}