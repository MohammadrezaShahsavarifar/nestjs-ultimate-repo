import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from '../../packages/core/guards/jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    // شبیه‌سازی متغیر محیطی JWT_SECRET برای تست
    process.env.JWT_SECRET = 'test-secret-key';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();
    
    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should return true for valid token', () => {
    // ساخت یک توکن معتبر با کلید مخفی تست
    const validToken = jwt.sign({ userId: 1, role: 'admin' }, process.env.JWT_SECRET as string);
    
    // شبیه‌سازی context با توکن معتبر
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: `Bearer ${validToken}` },
        }),
      }),
    };
    
    // انتظار داریم که گارد دسترسی را مجاز کند
    expect(guard.canActivate(mockContext as any)).toBe(true);
  });

  it('should throw UnauthorizedException for invalid token', () => {
    // یک توکن نامعتبر
    const invalidToken = 'invalid-token';
    
    // شبیه‌سازی context با توکن نامعتبر
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: `Bearer ${invalidToken}` },
        }),
      }),
    };
    
    // انتظار داریم که گارد یک استثنا پرتاب کند
    expect(() => guard.canActivate(mockContext as any)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when no token is provided', () => {
    // شبیه‌سازی context بدون هدر Authorization
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    };
    
    // انتظار داریم که گارد یک استثنا پرتاب کند
    expect(() => guard.canActivate(mockContext as any)).toThrow(UnauthorizedException);
  });
});