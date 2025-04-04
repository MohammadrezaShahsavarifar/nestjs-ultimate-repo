import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SANITIZE_OPTIONS_KEY, SanitizeOptions } from '../decorators/sanitize.decorator';

/**
 * اینترسپتور پاکسازی داده‌های ورودی
 * این کلاس مسئول پاکسازی داده‌های ورودی بر اساس تنظیمات دکوراتور Sanitize است
 */
@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  /**
   * متد اصلی اینترسپتور که درخواست را پردازش می‌کند
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // دریافت درخواست از کانتکست
    const request = context.switchToHttp().getRequest();
    
    // دریافت تنظیمات از متادیتا
    const options = this.reflector.get<SanitizeOptions>(
      SANITIZE_OPTIONS_KEY,
      context.getHandler(),
    ) || {};

    // تنظیم گزینه‌های پیش‌فرض
    const sanitizeOptions: Required<SanitizeOptions> = {
      fields: options.fields || [],
      deep: options.deep !== undefined ? options.deep : true,
      stripTags: options.stripTags !== undefined ? options.stripTags : true,
      escapeHtml: options.escapeHtml !== undefined ? options.escapeHtml : true,
      customSanitizer: options.customSanitizer || ((value: string) => value), // تابع پیش‌فرض که رشته را بدون تغییر برمی‌گرداند
    };

    // پاکسازی بدنه درخواست
    if (request.body) {
      request.body = this.sanitizeData(request.body, sanitizeOptions);
    }

    // پاکسازی پارامترهای کوئری
    if (request.query) {
      // Create a new object instead of modifying the original
      const sanitizedQuery: Record<string, any> = {};
      Object.keys(request.query).forEach(key => {
        if (typeof request.query[key] === 'string') {
          sanitizedQuery[key] = this.sanitizeString(request.query[key], sanitizeOptions);
        } else {
          sanitizedQuery[key] = request.query[key];
        }
      });
      
      // Use Object.defineProperty to replace the query object if possible
      try {
        Object.defineProperty(request, 'query', {
          value: sanitizedQuery,
          writable: true,
          configurable: true
        });
      } catch (e: unknown) {
        // If we can't replace it, log a warning
        if (e instanceof Error) {
          console.warn('Could not sanitize query parameters:', e.message);
        } else {
          console.warn('Could not sanitize query parameters: Unknown error');
        }
      }
    }

    // Remove this duplicate code since we're already handling query parameters above
    // if (request.query) {
    //   request.query = this.sanitizeData(request.query, sanitizeOptions);
    // }

    // پاکسازی پارامترهای مسیر
    if (request.params) {
      request.params = this.sanitizeData(request.params, sanitizeOptions);
    }

    // ادامه پردازش درخواست
    return next.handle();
  }

  /**
   * پاکسازی داده‌ها بر اساس تنظیمات
   * این متد به صورت بازگشتی داده‌ها را پاکسازی می‌کند
   */
  private sanitizeData(data: any, options: Required<SanitizeOptions>): any {
    if (!data) return data;

    // پاکسازی آرایه‌ها
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, options));
    }

    // پاکسازی آبجکت‌ها
    if (typeof data === 'object' && data !== null) {
      const sanitizedData = { ...data };
      
      for (const key in sanitizedData) {
        // اگر فیلدها مشخص شده‌اند و این فیلد در لیست نیست، رد شود
        if (options.fields.length > 0 && !options.fields.includes(key)) {
          continue;
        }

        // پاکسازی بازگشتی آبجکت‌های تودرتو اگر گزینه deep فعال است
        if (typeof sanitizedData[key] === 'object' && sanitizedData[key] !== null && options.deep) {
          sanitizedData[key] = this.sanitizeData(sanitizedData[key], options);
        } 
        // پاکسازی مقادیر رشته‌ای
        else if (typeof sanitizedData[key] === 'string') {
          sanitizedData[key] = this.sanitizeString(sanitizedData[key], options);
        }
      }
      
      return sanitizedData;
    }

    // پاکسازی مقادیر رشته‌ای مستقیم
    if (typeof data === 'string') {
      return this.sanitizeString(data, options);
    }

    return data;
  }

  /**
   * پاکسازی یک رشته بر اساس تنظیمات
   */
  private sanitizeString(value: string, options: Required<SanitizeOptions>): string {
    let sanitized = value;
  
    // اعمال پاکسازی سفارشی
    sanitized = options.customSanitizer(sanitized);
  
    // حذف تگ‌های HTML
    if (options.stripTags) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
  
    // تبدیل کاراکترهای خاص HTML به انتیتی‌ها
    if (options.escapeHtml) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  
    return sanitized;
  }
}