import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { PaginateOptions } from '../interfaces/paginate-options.interface';
import { PaginationInterceptor } from '../interceptors/pagination.interceptor';

/**
 * کلید متادیتای تنظیمات صفحه‌بندی
 */
export const PAGINATE_OPTIONS_KEY = 'paginateOptions';

/**
 * دکوراتور صفحه‌بندی
 * این دکوراتور به صورت خودکار صفحه‌بندی را برای API‌های لیستی مدیریت می‌کند
 * @param options تنظیمات صفحه‌بندی
 * @returns دکوراتور ترکیبی
 * @example
 * @Get('users')
 * @Paginate()
 * findAll() {
 *   return this.usersService.findAll();
 * }
 */
export function Paginate(options: PaginateOptions = {}) {
  return applyDecorators(
    SetMetadata(PAGINATE_OPTIONS_KEY, options),
    UseInterceptors(PaginationInterceptor),
  );
}