import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { SanitizeInterceptor } from '../interceptors/sanitize.interceptor';

// کلید متادیتا برای ذخیره تنظیمات دکوراتور
export const SANITIZE_OPTIONS_KEY = 'sanitize:options';

/**
 * تنظیمات دکوراتور Sanitize
 */
export interface SanitizeOptions {
  /**
   * فیلدهایی که باید پاکسازی شوند. اگر خالی باشد، تمام فیلدهای رشته‌ای پاکسازی می‌شوند.
   */
  fields?: string[];
  
  /**
   * آیا آبجکت‌های تودرتو هم پاکسازی شوند؟
   * @default true
   */
  deep?: boolean;
  
  /**
   * آیا تمام تگ‌های HTML حذف شوند؟
   * @default true
   */
  stripTags?: boolean;
  
  /**
   * آیا کاراکترهای خاص HTML به انتیتی‌ها تبدیل شوند؟
   * @default true
   */
  escapeHtml?: boolean;
  
  /**
   * تابع پاکسازی سفارشی
   */
  customSanitizer?: (value: string) => string;
}

/**
 * دکوراتور Sanitize برای پاکسازی داده‌های ورودی و جلوگیری از حملات XSS و سایر مشکلات امنیتی.
 * 
 * @param options تنظیمات پاکسازی
 * @returns دکوراتور
 * 
 * @example
 * // پاکسازی تمام فیلدهای رشته‌ای در بدنه درخواست
 * @Sanitize()
 * async createUser(@Body() createUserDto: CreateUserDto) {
 *   return this.userService.create(createUserDto);
 * }
 * 
 * @example
 * // پاکسازی فقط فیلدهای خاص
 * @Sanitize({ fields: ['name', 'description'] })
 * async updateProduct(@Body() updateProductDto: UpdateProductDto) {
 *   return this.productService.update(updateProductDto);
 * }
 * 
 * @example
 * // استفاده از پاکسازی سفارشی
 * @Sanitize({
 *   customSanitizer: (value) => value.replace(/script/gi, 'blocked')
 * })
 * async addComment(@Body() commentDto: CommentDto) {
 *   return this.commentService.add(commentDto);
 * }
 */
export function Sanitize(options: SanitizeOptions = {}) {
  // ترکیب چند دکوراتور با هم
  return applyDecorators(
    // ذخیره تنظیمات در متادیتا
    SetMetadata(SANITIZE_OPTIONS_KEY, options),
    // استفاده از اینترسپتور پاکسازی
    UseInterceptors(SanitizeInterceptor),
  );
}