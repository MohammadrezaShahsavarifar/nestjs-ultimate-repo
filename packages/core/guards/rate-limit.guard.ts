// وارد کردن کلاس‌ها و توابع مورد نیاز از NestJS و Express
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';

// تعریف اینترفیس برای تنظیمات محدودیت نرخ درخواست
// این اینترفیس تمام گزینه‌های قابل تنظیم را مشخص می‌کند
export interface RateLimitOptions {
  windowMs?: number;       // مدت زمان پنجره محدودیت (میلی‌ثانیه)
  max?: number;            // حداکثر تعداد درخواست‌ها در پنجره زمانی
  message?: string;        // پیام خطا در صورت تجاوز از محدودیت
  keyGenerator?: (req: Request) => string;  // تابع تولید کلید برای تفکیک کاربران
  statusCode?: number;     // کد وضعیت HTTP در صورت تجاوز از محدودیت
  headers?: boolean;       // آیا هدرهای محدودیت نرخ درخواست اضافه شوند؟
}

// تعریف نوع برای ذخیره‌سازی رکوردهای درخواست
// هر رکورد شامل تعداد درخواست‌ها و زمان بازنشانی است
interface RateLimitRecord {
  count: number;      // تعداد درخواست‌های انجام شده
  resetTime: number;  // زمان بازنشانی شمارنده (به میلی‌ثانیه)
}

// تعریف کلاس گارد محدودیت نرخ درخواست
// این کلاس با دکوراتور Injectable مشخص شده تا بتواند در سیستم تزریق وابستگی NestJS استفاده شود
@Injectable()
export class RateLimitGuard implements CanActivate {
  // تنظیمات پیش‌فرض برای محدودیت نرخ درخواست
  private static readonly DEFAULT_OPTIONS: RateLimitOptions = {
    windowMs: 60 * 1000,  // 1 دقیقه
    max: 100,             // حداکثر 100 درخواست در دقیقه
    message: 'Too many requests, please try again later.',  // پیام خطای پیش‌فرض
    statusCode: HttpStatus.TOO_MANY_REQUESTS,  // کد وضعیت 429
    headers: true,  // اضافه کردن هدرهای محدودیت نرخ درخواست
  };

  // ذخیره‌سازی رکوردهای درخواست برای هر کلید
  // از Map استفاده شده تا بتوان به سرعت رکوردها را بر اساس کلید پیدا کرد
  private static readonly records = new Map<string, RateLimitRecord>();

  // سازنده کلاس که Reflector را دریافت می‌کند
  // Reflector برای دسترسی به متادیتا استفاده می‌شود
  constructor(private reflector: Reflector) {}

  // متد اصلی گارد که بررسی می‌کند آیا درخواست مجاز است یا خیر
  canActivate(context: ExecutionContext): boolean {
    // دریافت تنظیمات از متادیتا
    const options = this.getOptions(context);
    
    // دریافت درخواست و پاسخ از کانتکست
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // تولید کلید برای تفکیک کاربران
    const key = this.generateKey(request, options);
    
    // بررسی و اعمال محدودیت
    const result = this.checkRateLimit(key, options);
    
    // اضافه کردن هدرهای محدودیت نرخ درخواست
    if (options.headers) {
      this.addHeaders(response, result);
    }
    
    // اگر از محدودیت تجاوز شده باشد، خطا پرتاب می‌شود
    if (!result.allowed) {
      const message = options.message || RateLimitGuard.DEFAULT_OPTIONS.message;
      const statusCode = options.statusCode || RateLimitGuard.DEFAULT_OPTIONS.statusCode;
      throw new HttpException(message || 'Too many requests', statusCode || HttpStatus.TOO_MANY_REQUESTS);
    }
    
    // اگر درخواست مجاز باشد، true برگردانده می‌شود
    return true;
  }

  // متد کمکی برای دریافت تنظیمات از متادیتا
  private getOptions(context: ExecutionContext): RateLimitOptions {
    // دریافت تنظیمات از متادیتا با کلید 'rateLimit'
    const options = this.reflector.get<RateLimitOptions>('rateLimit', context.getHandler()) || {};
    
    // ترکیب تنظیمات پیش‌فرض و تنظیمات سفارشی
    // تنظیمات سفارشی اولویت بالاتری دارند
    return { ...RateLimitGuard.DEFAULT_OPTIONS, ...options };
  }

  // متد کمکی برای تولید کلید بر اساس درخواست
  private generateKey(request: Request, options: RateLimitOptions): string {
    // اگر تابع تولید کلید سفارشی تعریف شده باشد، از آن استفاده می‌شود
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }
    
    // در غیر این صورت، از آدرس IP به عنوان کلید استفاده می‌شود
    // اگر IP موجود نباشد، از آدرس IP اتصال استفاده می‌شود
    // اگر هیچ کدام موجود نباشند، از 'unknown' استفاده می‌شود
    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  // متد کمکی برای بررسی و اعمال محدودیت نرخ درخواست
  private checkRateLimit(key: string, options: RateLimitOptions): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();  // زمان فعلی به میلی‌ثانیه
    
    // استفاده از عملگر ! برای اطمینان دادن به TypeScript که مقدار undefined نخواهد بود
    const windowMs = options.windowMs ?? RateLimitGuard.DEFAULT_OPTIONS.windowMs!;
    const max = options.max ?? RateLimitGuard.DEFAULT_OPTIONS.max!;
    
    // دریافت رکورد موجود یا ایجاد رکورد جدید
    let record = RateLimitGuard.records.get(key);
    
    // اگر رکورد موجود نباشد یا زمان بازنشانی آن گذشته باشد
    if (!record || now > record.resetTime) {
      // ایجاد رکورد جدید
      record = {
        count: 0,  // شمارنده از صفر شروع می‌شود
        resetTime: now + windowMs,  // زمان بازنشانی = زمان فعلی + مدت پنجره
      };
    }
    
    // افزایش شمارنده درخواست‌ها
    record.count += 1;
    
    // ذخیره رکورد به‌روزرسانی شده
    RateLimitGuard.records.set(key, record);
    
    // بررسی آیا از محدودیت تجاوز شده است
    const allowed = record.count <= max;  // اگر تعداد درخواست‌ها کمتر یا مساوی حداکثر باشد، مجاز است
    const remaining = Math.max(0, max - record.count);  // تعداد درخواست‌های باقی‌مانده
    
    // برگرداندن نتیجه بررسی
    return {
      allowed,  // آیا درخواست مجاز است؟
      remaining,  // تعداد درخواست‌های باقی‌مانده
      resetTime: record.resetTime,  // زمان بازنشانی
    };
  }

  // متد کمکی برای اضافه کردن هدرهای محدودیت نرخ درخواست
  private addHeaders(response: Response, result: { remaining: number; resetTime: number }): void {
    // اضافه کردن هدر تعداد درخواست‌های باقی‌مانده
    response.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    
    // اضافه کردن هدر زمان بازنشانی (به ثانیه)
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  }
}