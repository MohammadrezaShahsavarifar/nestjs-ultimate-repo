import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // درخواست HTTP را از Context استخراج می‌کنیم.
    const request = context.switchToHttp().getRequest();

    // توکن JWT را از هدر Authorization استخراج می‌کنیم.
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('توکن احراز هویت ارائه نشده است');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('فرمت توکن نامعتبر است');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET در متغیرهای محیطی تعریف نشده است");
    }
    
    try {
      // توکن را با استفاده از کلید مخفی (JWT_SECRET) اعتبارسنجی می‌کنیم.
      const decoded = jwt.verify(token, jwtSecret);
      request.user = decoded; // اطلاعات کاربر را به درخواست اضافه می‌کنیم تا در Controller قابل دسترسی باشد.
      return true; // اگر توکن معتبر بود، دسترسی اعطا می‌شود.
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('توکن منقضی شده است');
      } else if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('توکن نامعتبر است');
      }
      throw new UnauthorizedException('خطا در احراز هویت');
    }
  }
}