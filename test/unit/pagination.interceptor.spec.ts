import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { PaginationInterceptor } from '../../packages/core/interceptors/pagination.interceptor';
import { PAGINATE_OPTIONS_KEY } from '../../packages/core/decorators/paginate.decorator';

describe('PaginationInterceptor', () => {
  let interceptor: PaginationInterceptor;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginationInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<PaginationInterceptor>(PaginationInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should paginate an array', (done) => {
    // تنظیم متادیتا
    jest.spyOn(reflector, 'get').mockReturnValue({});

    // ایجاد آرایه تست با 20 آیتم
    const testArray = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));

    // ایجاد کانتکست مصنوعی
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          query: { page: '2', limit: '5' },
        }),
      }),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;

    // ایجاد هندلر مصنوعی
    const mockCallHandler: CallHandler = {
      handle: () => of(testArray),
    };

    // اجرای اینترسپتور
    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      // بررسی ساختار پاسخ
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('meta');
      
      // بررسی آیتم‌های صفحه‌بندی شده
      expect(result.items).toHaveLength(5);
      expect(result.items[0].id).toBe(6); // آیتم اول صفحه دوم
      
      // بررسی متادیتا
      expect(result.meta.currentPage).toBe(2);
      expect(result.meta.itemsPerPage).toBe(5);
      expect(result.meta.totalItems).toBe(20);
      expect(result.meta.totalPages).toBe(4);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(true);
      
      done();
    });
  });

  it('should return original data if not an array', (done) => {
    // تنظیم متادیتا
    jest.spyOn(reflector, 'get').mockReturnValue({});

    // داده غیر آرایه‌ای
    const testData = { message: 'This is not an array' };

    // ایجاد کانتکست مصنوعی
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          query: {},
        }),
      }),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;

    // ایجاد هندلر مصنوعی
    const mockCallHandler: CallHandler = {
      handle: () => of(testData),
    };

    // اجرای اینترسپتور
    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      // بررسی که داده بدون تغییر برگردانده شده
      expect(result).toEqual(testData);
      done();
    });
  });
});