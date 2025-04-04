import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, Controller, Get, Module } from '@nestjs/common';
import { RateLimit } from '../../packages/core/decorators/rate-limit.decorator';

// ایجاد یک کنترلر تست برای آزمایش دکوراتور
@Controller('test-rate-limit')
class TestController {
  @Get('limited')
  @RateLimit({ max: 2, windowMs: 1000 }) // محدودیت به 2 درخواست در ثانیه
  limitedEndpoint() {
    return { message: 'This is a rate-limited endpoint' };
  }

  @Get('unlimited')
  unlimitedEndpoint() {
    return { message: 'This is an unlimited endpoint' };
  }
}

@Module({
  controllers: [TestController],
})
class TestModule {}

describe('RateLimit Decorator (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should allow requests within the rate limit', async () => {
    // درخواست اول
    const response1 = await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // بررسی پاسخ موفق
    expect(response1.status).toBe(200);
    expect(response1.body).toEqual({ message: 'This is a rate-limited endpoint' });
    
    // درخواست دوم
    const response2 = await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // بررسی پاسخ موفق
    expect(response2.status).toBe(200);
    expect(response2.body).toEqual({ message: 'This is a rate-limited endpoint' });
  });

  it('should block requests exceeding the rate limit', async () => {
    // درخواست اول
    await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // درخواست دوم
    await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // درخواست سوم (باید محدود شود)
    const response3 = await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // بررسی پاسخ خطا
    expect(response3.status).toBe(429); // Too Many Requests
  });

  it('should not limit unlimited endpoints', async () => {
    // ارسال چندین درخواست به اندپوینت بدون محدودیت
    for (let i = 0; i < 5; i++) {
      const response = await request(app.getHttpServer())
        .get('/test-rate-limit/unlimited');
      
      // بررسی پاسخ موفق
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'This is an unlimited endpoint' });
    }
  });

  it('should include rate limit headers in the response', async () => {
    const response = await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // بررسی وجود هدرهای محدودیت نرخ درخواست
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    expect(response.headers).toHaveProperty('x-ratelimit-reset');
  });

  it('should reset the rate limit after the window time', async () => {
    // درخواست اول
    await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // درخواست دوم
    await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // درخواست سوم (باید محدود شود)
    const response3 = await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // بررسی پاسخ خطا
    expect(response3.status).toBe(429);
    
    // انتظار برای پایان پنجره زمانی
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // درخواست بعد از پایان پنجره زمانی (باید مجاز باشد)
    const response4 = await request(app.getHttpServer())
      .get('/test-rate-limit/limited');
    
    // بررسی پاسخ موفق
    expect(response4.status).toBe(200);
  });

  afterAll(async () => {
    await app.close();
  });
});