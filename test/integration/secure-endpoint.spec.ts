import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ExecutionContext, Controller, Get, UnauthorizedException } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { JwtAuthGuard } from '../../packages/core/guards/jwt-auth.guard';
import { RolesGuard } from '../../packages/core/guards/roles.guard';
import { SecureEndpoint } from '../../packages/core/decorators/secure-endpoint.decorator';
import * as jwt from 'jsonwebtoken';

// ایجاد یک کنترلر تست برای آزمایش دکوراتور
@Controller('test')
class TestController {
  @Get('admin-only')
  @SecureEndpoint(['admin'])
  adminOnly() {
    return { message: 'This is an admin-only endpoint' };
  }

  @Get('user-endpoint')
  @SecureEndpoint(['user', 'admin'])
  userEndpoint() {
    return { message: 'This endpoint is accessible by users and admins' };
  }
}

describe('SecureEndpoint Decorator (Integration)', () => {
  let app: INestApplication;
  const JWT_SECRET = 'test-secret-key';

  beforeAll(async () => {
    // تنظیم متغیر محیطی برای تست
    process.env.JWT_SECRET = JWT_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;
          
          if (!authHeader) {
            throw new UnauthorizedException('توکن احراز هویت ارائه نشده است');
          }
          
          const token = authHeader.split(' ')[1];
          
          try {
            // بررسی اعتبار توکن
            const decoded = jwt.verify(token, JWT_SECRET);
            request.user = decoded; // اضافه کردن اطلاعات کاربر به درخواست
            return true;
          } catch (err) {
            throw new UnauthorizedException('توکن نامعتبر است');
          }
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should allow access to admin-only endpoint for admin role', async () => {
    // ساخت توکن معتبر با نقش admin
    const validAdminToken = jwt.sign({ userId: 1, role: 'admin' }, JWT_SECRET);
    
    // ارسال درخواست با توکن admin
    const response = await request(app.getHttpServer())
      .get('/test/admin-only')
      .set('Authorization', `Bearer ${validAdminToken}`);
      
    // بررسی پاسخ موفق
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'This is an admin-only endpoint' });
  });

  it('should deny access to admin-only endpoint for user role', async () => {
    // ساخت توکن معتبر با نقش user
    const validUserToken = jwt.sign({ userId: 1, role: 'user' }, JWT_SECRET);
    
    // ارسال درخواست با توکن user
    const response = await request(app.getHttpServer())
      .get('/test/admin-only')
      .set('Authorization', `Bearer ${validUserToken}`);
      
    // بررسی رد دسترسی
    expect(response.status).toBe(403);
  });

  it('should allow access to user endpoint for both user and admin roles', async () => {
    // ساخت توکن معتبر با نقش user
    const validUserToken = jwt.sign({ userId: 1, role: 'user' }, JWT_SECRET);
    
    // ارسال درخواست با توکن user
    const userResponse = await request(app.getHttpServer())
      .get('/test/user-endpoint')
      .set('Authorization', `Bearer ${validUserToken}`);
      
    // بررسی پاسخ موفق برای کاربر
    expect(userResponse.status).toBe(200);
    
    // ساخت توکن معتبر با نقش admin
    const validAdminToken = jwt.sign({ userId: 1, role: 'admin' }, JWT_SECRET);
    
    // ارسال درخواست با توکن admin
    const adminResponse = await request(app.getHttpServer())
      .get('/test/user-endpoint')
      .set('Authorization', `Bearer ${validAdminToken}`);
      
    // بررسی پاسخ موفق برای ادمین
    expect(adminResponse.status).toBe(200);
  });

  it('should deny access when no token is provided', async () => {
    // ارسال درخواست بدون توکن
    const response = await request(app.getHttpServer())
      .get('/test/admin-only');
      
    // بررسی رد دسترسی
    expect(response.status).toBe(401);
  });

  afterAll(async () => {
    await app.close();
  });
});