import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Controller, Module, Get, Query } from '@nestjs/common';
import { Paginate } from '../../packages/core/decorators/paginate.decorator';
import { PaginationInterceptor } from '../../packages/core/interceptors/pagination.interceptor';

// کنترلر تست
@Controller('test-pagination')
class TestController {
  private readonly users = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
  }));

  @Get('users')
  @Paginate()
  getUsers() {
    return this.users;
  }

  @Get('users-custom')
  @Paginate({
    defaultLimit: 5,
    maxLimit: 20,
    pageParam: 'p',
    limitParam: 'size',
    itemsKey: 'data',
    metaKey: 'pagination',
  })
  getUsersCustom() {
    return this.users;
  }

  @Get('users-no-metadata')
  @Paginate({
    includeMetadata: false,
  })
  getUsersNoMetadata() {
    return this.users;
  }

  @Get('not-array')
  @Paginate()
  getNotArray() {
    return { message: 'This is not an array' };
  }
}

// ماژول تست
@Module({
  controllers: [TestController],
  providers: [PaginationInterceptor],
})
class TestModule {}

describe('Paginate Decorator (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should paginate with default settings', () => {
    return request(app.getHttpServer())
      .get('/test-pagination/users')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('items');
        expect(res.body).toHaveProperty('meta');
        expect(res.body.items).toHaveLength(10); // اندازه صفحه پیش‌فرض
        expect(res.body.meta.currentPage).toBe(1);
        expect(res.body.meta.totalItems).toBe(50);
      });
  });

  it('should paginate with custom page and limit', () => {
    return request(app.getHttpServer())
      .get('/test-pagination/users?page=3&limit=7')
      .expect(200)
      .expect((res) => {
        expect(res.body.items).toHaveLength(7);
        expect(res.body.meta.currentPage).toBe(3);
        expect(res.body.meta.itemsPerPage).toBe(7);
        expect(res.body.items[0].id).toBe(15); // آیتم اول صفحه سوم با اندازه صفحه 7
      });
  });

  it('should paginate with custom parameters', () => {
    return request(app.getHttpServer())
      .get('/test-pagination/users-custom?p=2&size=5')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.data).toHaveLength(5);
        expect(res.body.pagination.currentPage).toBe(2);
      });
  });

  it('should return only items without metadata', () => {
    return request(app.getHttpServer())
      .get('/test-pagination/users-no-metadata')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('items');
        expect(res.body).not.toHaveProperty('meta');
      });
  });

  it('should return original data if not an array', () => {
    return request(app.getHttpServer())
      .get('/test-pagination/not-array')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ message: 'This is not an array' });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});