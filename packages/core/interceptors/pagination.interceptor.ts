import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PAGINATE_OPTIONS_KEY } from '../decorators/paginate.decorator';
import { PaginateOptions, PaginationMeta } from '../interfaces/paginate-options.interface';
import { PaginationUtils } from '../utils/pagination.utils';

/**
 * اینترسپتور صفحه‌بندی
 * این اینترسپتور منطق صفحه‌بندی را اعمال می‌کند
 */
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  /**
   * تنظیمات پیش‌فرض صفحه‌بندی
   */
  private readonly defaultOptions: Required<PaginateOptions> = {
    defaultLimit: 10,
    maxLimit: 100,
    pageParam: 'page',
    limitParam: 'limit',
    sortParam: 'sort',
    includeMetadata: true,
    itemsKey: 'items',
    metaKey: 'meta',
  };

  /**
   * اعمال اینترسپتور
   * @param context کانتکست اجرا
   * @param next هندلر بعدی
   * @returns نتیجه اینترسپت شده
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // دریافت تنظیمات از متادیتا
    const options = this.reflector.get<PaginateOptions>(
      PAGINATE_OPTIONS_KEY,
      context.getHandler(),
    ) || {};

    // ترکیب تنظیمات با مقادیر پیش‌فرض
    const paginateOptions: Required<PaginateOptions> = {
      ...this.defaultOptions,
      ...options,
    };

    // دریافت پارامترهای کوئری
    const request = context.switchToHttp().getRequest();
    const { page, limit, sort } = PaginationUtils.extractPaginationParams(
      request.query,
      paginateOptions,
    );

    // ذخیره پارامترهای صفحه‌بندی در درخواست برای استفاده در کنترلر
    request.pagination = { page, limit, sort };

    return next.handle().pipe(
      map((data) => {
        // اگر داده آرایه نیست، بدون تغییر برگردان
        if (!Array.isArray(data)) {
          return data;
        }

        const totalItems = data.length;
        const paginatedItems = PaginationUtils.paginateArray(data, page, limit);
        const meta = PaginationUtils.createMeta(totalItems, page, limit);

        return PaginationUtils.createPaginatedResponse(
          paginatedItems,
          meta,
          paginateOptions,
        );
      }),
    );
  }
}