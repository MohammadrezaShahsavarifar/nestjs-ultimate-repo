import { PaginateOptions, PaginationMeta } from '../interfaces/paginate-options.interface';

/**
 * کلاس کمکی برای عملیات صفحه‌بندی
 */
export class PaginationUtils {
  /**
   * محاسبه متادیتای صفحه‌بندی
   * @param totalItems تعداد کل آیتم‌ها
   * @param page شماره صفحه فعلی
   * @param limit تعداد آیتم در صفحه
   * @returns متادیتای صفحه‌بندی
   */
  static createMeta(totalItems: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * اعمال صفحه‌بندی روی آرایه
   * @param array آرایه داده‌ها
   * @param page شماره صفحه
   * @param limit تعداد آیتم در صفحه
   * @returns آیتم‌های صفحه مورد نظر
   */
  static paginateArray<T>(array: T[], page: number, limit: number): T[] {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return array.slice(startIndex, endIndex);
  }

  /**
   * استخراج پارامترهای صفحه‌بندی از کوئری
   * @param query پارامترهای کوئری
   * @param options تنظیمات صفحه‌بندی
   * @returns پارامترهای صفحه‌بندی استاندارد
   */
  static extractPaginationParams(query: any, options: Required<PaginateOptions>) {
    const page = Math.max(1, parseInt(query[options.pageParam] || '1', 10));
    let limit = parseInt(query[options.limitParam] || options.defaultLimit.toString(), 10);
    
    // محدود کردن اندازه صفحه به حداکثر مجاز
    limit = Math.min(limit, options.maxLimit);
    
    // استخراج پارامتر مرتب‌سازی
    const sort = query[options.sortParam] || undefined;
    
    return { page, limit, sort };
  }

  /**
   * ایجاد پاسخ صفحه‌بندی شده
   * @param items آیتم‌های صفحه فعلی
   * @param meta متادیتای صفحه‌بندی
   * @param options تنظیمات صفحه‌بندی
   * @returns پاسخ صفحه‌بندی شده
   */
  static createPaginatedResponse<T>(
    items: T[],
    meta: PaginationMeta,
    options: Required<PaginateOptions>,
  ) {
    const response: any = {
      [options.itemsKey]: items,
    };
    
    if (options.includeMetadata) {
      response[options.metaKey] = meta;
    }
    
    return response;
  }
}