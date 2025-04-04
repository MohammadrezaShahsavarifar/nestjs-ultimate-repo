/**
 * توابع کمکی برای پاکسازی داده‌ها
 * این کلاس شامل توابع مختلف برای پاکسازی داده‌ها است که می‌توان از آن‌ها در دکوراتور Sanitize استفاده کرد
 */
export class SanitizeUtils {
  /**
   * حذف تمام تگ‌های HTML از یک رشته
   * @param input رشته ورودی
   * @returns رشته پاکسازی شده
   */
  static stripHtmlTags(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * تبدیل کاراکترهای خاص HTML به انتیتی‌ها
   * @param input رشته ورودی
   * @returns رشته پاکسازی شده
   */
  static escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * پاکسازی یک رشته برای جلوگیری از حملات SQL Injection
   * @param input رشته ورودی
   * @returns رشته پاکسازی شده
   */
  static preventSqlInjection(input: string): string {
    // پاکسازی پایه برای جلوگیری از SQL Injection
    return input
      .replace(/'/g, "''")
      .replace(/--/g, '')
      .replace(/;/g, '');
  }

  /**
   * پاکسازی یک رشته برای استفاده در URL
   * @param input رشته ورودی
   * @returns رشته پاکسازی شده
   */
  static sanitizeUrl(input: string): string {
    // حذف پروتکل‌های خطرناک
    return input.replace(/^(javascript|data|vbscript):/i, '');
  }

  /**
   * پاکسازی یک رشته برای استفاده به عنوان نام فایل
   * @param input رشته ورودی
   * @returns رشته پاکسازی شده
   */
  static sanitizeFilename(input: string): string {
    // حذف کاراکترهای غیرمجاز در نام فایل
    return input.replace(/[/\\?%*:|"<>]/g, '-');
  }

  /**
   * ایجاد یک پاکسازی کننده سفارشی که چندین تابع پاکسازی را ترکیب می‌کند
   * @param sanitizers آرایه‌ای از توابع پاکسازی
   * @returns تابع پاکسازی ترکیبی
   */
  static combine(...sanitizers: ((input: string) => string)[]): (input: string) => string {
    return (input: string) => {
      return sanitizers.reduce((result, sanitizer) => sanitizer(result), input);
    };
  }
}