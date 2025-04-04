// Import مورد نیاز برای استفاده از دکوراتورها و Guardها
import { applyDecorators, UseGuards,SetMetadata } from '@nestjs/common'; 
// Guard مربوط به اعتبارسنجی JWT را وارد می‌کنیم
import { JwtAuthGuard } from '../guards/jwt-auth.guard'; 
// Guard مربوط به بررسی نقش‌های کاربری (RBAC) را وارد می‌کنیم
import { RolesGuard } from '../guards/roles.guard'; 

// تعریف دکوراتور سفارشی SecureEndpoint
export function SecureEndpoint(roles: string[]) {
  // از applyDecorators برای ترکیب چندین دکوراتور در یک دکوراتور سفارشی استفاده می‌کنیم [[4]]
  return applyDecorators(
    SetMetadata('roles', roles), // ذخیره نقش‌ها در متادیتا
    // اعمال Guardهای JwtAuthGuard و RolesGuard برای محافظت از Endpoint
    UseGuards(JwtAuthGuard, RolesGuard), // استفاده از Guardها
  );
}