import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from "@nestjs/core"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // اگر نقش‌های مورد نیاز تعریف نشده باشند، دسترسی را مجاز می‌کنیم
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    // درخواست HTTP را از Context استخراج می‌کنیم.
    const request = context.switchToHttp().getRequest();

    // بررسی می‌کنیم که آیا اطلاعات کاربر وجود دارد
    if (!request.user) {
      throw new ForbiddenException('کاربر احراز هویت نشده است');
    }

    // نقش کاربر را از اطلاعات توکن استخراج می‌کنیم.
    const userRole = request.user.role;
    
    // اگر کاربر نقش نداشته باشد
    if (!userRole) {
      throw new ForbiddenException('کاربر نقش ندارد');
    }

    // بررسی می‌کنیم که آیا نقش کاربر در لیست نقش‌های مجاز است یا خیر.
    return requiredRoles.includes(userRole);
  }
}