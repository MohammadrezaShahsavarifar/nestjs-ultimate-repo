import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../packages/core/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();
    
    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access for admin role', () => {
    // شبیه‌سازی متادیتا با نقش admin
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    
    // شبیه‌سازی context با کاربری که نقش admin دارد
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: 'admin' },
        }),
      }),
    };
    
    // انتظار داریم که گارد دسترسی را مجاز کند
    expect(guard.canActivate(mockContext as any)).toBe(true);
  });

  it('should deny access for non-admin role', () => {
    // شبیه‌سازی متادیتا با نقش admin
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    
    // شبیه‌سازی context با کاربری که نقش user دارد
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: 'user' },
        }),
      }),
    };
    
    // انتظار داریم که گارد دسترسی را رد کند
    expect(guard.canActivate(mockContext as any)).toBe(false);
  });

  it('should throw ForbiddenException when user has no role', () => {
    // شبیه‌سازی متادیتا با نقش admin
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    
    // شبیه‌سازی context با کاربری که نقش ندارد
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { }, // کاربر بدون نقش
        }),
      }),
    };
    
    // انتظار داریم که گارد یک استثنا پرتاب کند
    expect(() => guard.canActivate(mockContext as any)).toThrow(ForbiddenException);
  });

  it('should allow access when no roles are required', () => {
    // شبیه‌سازی متادیتا بدون نقش
    jest.spyOn(reflector, 'get').mockReturnValue(null);
    
    // شبیه‌سازی context با کاربر معمولی
    const mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: 'user' },
        }),
      }),
    };
    
    // انتظار داریم که گارد دسترسی را مجاز کند
    expect(guard.canActivate(mockContext as any)).toBe(true);
  });
});