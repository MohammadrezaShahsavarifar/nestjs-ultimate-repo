// وارد کردن کتابخانه‌های مورد نیاز برای تست
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from '../../packages/core/guards/rate-limit.guard';

// تابع کمکی برای ایجاد یک کانتکست مصنوعی
// این تابع یک آدرس IP می‌گیرد و یک کانتکست اجرایی شبیه‌سازی شده برمی‌گرداند
function createMockContext(ip: string): ExecutionContext {
  // ایجاد یک درخواست مصنوعی با آدرس IP مشخص شده
  const mockRequest = {
    ip,
    connection: { remoteAddress: ip },
  };

  // ایجاد یک پاسخ مصنوعی با متد setHeader
  const mockResponse = {
    setHeader: jest.fn(), // یک تابع مصنوعی که می‌توان آن را ردیابی کرد
  };

  // ایجاد و برگرداندن یک کانتکست اجرایی کامل
  return {
    getHandler: jest.fn(), // تابع مصنوعی برای دریافت هندلر
    switchToHttp: jest.fn().mockReturnValue({ // تابع مصنوعی برای تغییر به حالت HTTP
      getRequest: jest.fn().mockReturnValue(mockRequest), // برگرداندن درخواست مصنوعی
      getResponse: jest.fn().mockReturnValue(mockResponse), // برگرداندن پاسخ مصنوعی
    }),
  } as unknown as ExecutionContext; // تبدیل نوع به ExecutionContext
}

// شروع بلوک اصلی تست‌ها
describe('RateLimitGuard', () => {
  // تعریف متغیرهای مورد نیاز در سطح بلوک تست
  let guard: RateLimitGuard; // نمونه گارد محدودیت نرخ
  let reflector: Reflector; // نمونه Reflector برای دسترسی به متادیتا

  // قبل از هر تست، این بلوک اجرا می‌شود
  beforeEach(async () => {
    // ایجاد یک ماژول تست با ارائه‌دهندگان مورد نیاز
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard, // ارائه‌دهنده اصلی که می‌خواهیم تست کنیم
        {
          provide: Reflector, // ارائه یک نمونه مصنوعی از Reflector
          useValue: {
            get: jest.fn(), // تابع مصنوعی برای متد get
          },
        },
      ],
    }).compile(); // کامپایل ماژول تست

    // دریافت نمونه‌های مورد نیاز از ماژول تست
    guard = module.get<RateLimitGuard>(RateLimitGuard);
    reflector = module.get<Reflector>(Reflector);
    
    // بازنشانی نقشه رکوردها قبل از هر تست برای اطمینان از شروع با حالت تمیز
    (RateLimitGuard as any).records = new Map();
  });

  // تست اول: بررسی می‌کند که گارد به درستی تعریف شده باشد
  it('should be defined', () => {
    expect(guard).toBeDefined(); // انتظار داریم گارد تعریف شده باشد
  });

  // تست دوم: بررسی می‌کند که درخواست‌ها در محدوده مجاز پذیرفته شوند
  it('should allow requests within the rate limit', () => {
    // تنظیم متادیتا برای محدودیت 2 درخواست در 1 ثانیه
    jest.spyOn(reflector, 'get').mockReturnValue({ max: 2, windowMs: 1000 });

    // ایجاد یک کانتکست مصنوعی با IP مشخص
    const mockContext = createMockContext('127.0.0.1');

    // درخواست اول باید مجاز باشد
    expect(guard.canActivate(mockContext as any)).toBe(true);
    
    // درخواست دوم نیز باید مجاز باشد
    expect(guard.canActivate(mockContext as any)).toBe(true);
  });

  // تست سوم: بررسی می‌کند که درخواست‌های بیش از حد مجاز مسدود شوند
  it('should block requests exceeding the rate limit', () => {
    // تنظیم متادیتا برای محدودیت 1 درخواست در 1 ثانیه
    jest.spyOn(reflector, 'get').mockReturnValue({ max: 1, windowMs: 1000 });

    // ایجاد یک کانتکست مصنوعی با IP مشخص
    const mockContext = createMockContext('127.0.0.1');

    // درخواست اول باید مجاز باشد
    expect(guard.canActivate(mockContext as any)).toBe(true);
    
    // درخواست دوم باید خطا پرتاب کند
    let errorThrown = false; // متغیر پرچم برای ردیابی پرتاب خطا
    try {
      guard.canActivate(mockContext as any); // اجرای کد که انتظار داریم خطا پرتاب کند
    } catch (error) {
      errorThrown = true; // اگر خطا پرتاب شد، پرچم را true می‌کنیم
      expect(error).toBeInstanceOf(HttpException); // انتظار داریم خطا از نوع HttpException باشد
    }
    expect(errorThrown).toBe(true); // انتظار داریم خطا پرتاب شده باشد
  });

  // تست چهارم: بررسی می‌کند که گارد بین IP‌های مختلف تمایز قائل شود
  it('should differentiate between different IPs', () => {
    // تنظیم متادیتا برای محدودیت 1 درخواست در 1 ثانیه
    jest.spyOn(reflector, 'get').mockReturnValue({ max: 1, windowMs: 1000 });

    // ایجاد دو کانتکست مصنوعی با IP‌های متفاوت
    const mockContext1 = createMockContext('127.0.0.1');
    const mockContext2 = createMockContext('192.168.1.1');

    // درخواست اول از IP اول باید مجاز باشد
    expect(guard.canActivate(mockContext1 as any)).toBe(true);
    
    // درخواست اول از IP دوم نیز باید مجاز باشد
    expect(guard.canActivate(mockContext2 as any)).toBe(true);
    
    // درخواست دوم از IP اول باید خطا پرتاب کند
    let errorThrown = false;
    try {
      guard.canActivate(mockContext1 as any);
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(HttpException);
    }
    expect(errorThrown).toBe(true);
  });

  // تست پنجم: بررسی می‌کند که شمارنده پس از پایان پنجره زمانی بازنشانی شود
  it('should reset the counter after the window time', async () => {
    // تنظیم متادیتا برای محدودیت 1 درخواست در 100 میلی‌ثانیه
    jest.spyOn(reflector, 'get').mockReturnValue({ max: 1, windowMs: 100 });

    // ایجاد یک کانتکست مصنوعی با IP مشخص
    const mockContext = createMockContext('127.0.0.1');

    // درخواست اول باید مجاز باشد
    expect(guard.canActivate(mockContext as any)).toBe(true);
    
    // درخواست دوم باید خطا پرتاب کند
    let errorThrown = false;
    try {
      guard.canActivate(mockContext as any);
    } catch (error) {
      errorThrown = true;
      expect(error).toBeInstanceOf(HttpException);
    }
    expect(errorThrown).toBe(true);
    
    // انتظار برای پایان پنجره زمانی (150 میلی‌ثانیه > 100 میلی‌ثانیه)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // درخواست بعد از پایان پنجره زمانی باید مجاز باشد
    expect(guard.canActivate(mockContext as any)).toBe(true);
  });
});