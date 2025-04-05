/**
 * تنظیمات صفحه‌بندی
 */
export interface PaginateOptions {
  /**
   * اندازه صفحه پیش‌فرض
   * @default 10
   */
  defaultLimit?: number;

  /**
   * حداکثر اندازه صفحه مجاز
   * @default 100
   */
  maxLimit?: number;

  /**
   * نام پارامتر صفحه در کوئری
   * @default 'page'
   */
  pageParam?: string;

  /**
   * نام پارامتر تعداد آیتم در صفحه در کوئری
   * @default 'limit'
   */
  limitParam?: string;

  /**
   * نام پارامتر مرتب‌سازی در کوئری
   * @default 'sort'
   */
  sortParam?: string;

  /**
   * آیا متادیتای صفحه‌بندی به پاسخ اضافه شود
   * @default true
   */
  includeMetadata?: boolean;

  /**
   * نام فیلد آیتم‌ها در پاسخ
   * @default 'items'
   */
  itemsKey?: string;

  /**
   * نام فیلد متادیتا در پاسخ
   * @default 'meta'
   */
  metaKey?: string;
}

/**
 * متادیتای صفحه‌بندی
 */
export interface PaginationMeta {
  /**
   * شماره صفحه فعلی
   */
  currentPage: number;

  /**
   * تعداد آیتم در صفحه
   */
  itemsPerPage: number;

  /**
   * تعداد کل آیتم‌ها
   */
  totalItems: number;

  /**
   * تعداد کل صفحات
   */
  totalPages: number;

  /**
   * آیا صفحه بعدی وجود دارد
   */
  hasNextPage: boolean;

  /**
   * آیا صفحه قبلی وجود دارد
   */
  hasPreviousPage: boolean;
}

/**
 * پاسخ صفحه‌بندی شده
 */
export interface PaginatedResponse<T> {
  /**
   * آیتم‌های صفحه فعلی
   */
  [key: string]: T[] | PaginationMeta;
}