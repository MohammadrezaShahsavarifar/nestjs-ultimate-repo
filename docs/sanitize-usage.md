/* import { Controller, Get, Post, Body, Query, Param, Injectable } from '@nestjs/common';
import { Sanitize } from '../../packages/core/decorators/sanitize.decorator';
import { SanitizeUtils } from '../../packages/core/utils/sanitize.utils';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SanitizeInterceptor } from '../../packages/core/interceptors/sanitize.interceptor';
import { Reflector } from '@nestjs/core';

// استفاده پایه از دکوراتور Sanitize
@Post('users')
@Sanitize()
createUser(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}

// پاکسازی فیلدهای خاص
@Post('articles')
@Sanitize({ fields: ['title', 'content'] })
createArticle(@Body() createArticleDto: CreateArticleDto) {
  return this.articlesService.create(createArticleDto);
}

// حفظ تگ‌های HTML و تبدیل کاراکترهای خاص
@Post('rich-content')
@Sanitize({
  stripTags: false,
  escapeHtml: true
})
createRichContent(@Body() contentDto: ContentDto) {
  return this.contentService.create(contentDto);
}

// استفاده از پاکسازی سفارشی
@Post('comments')
@Sanitize({
  customSanitizer: (value: string) => {
    // پاکسازی سفارشی
    return value.replace(/بد|زشت|ناپسند/g, '***');
  }
})
createComment(@Body() commentDto: CommentDto) {
  return this.commentsService.create(commentDto);
}

// ترکیب توابع پاکسازی
@Post('secure-data')
@Sanitize({
  customSanitizer: SanitizeUtils.combine(
    SanitizeUtils.stripHtmlTags,
    SanitizeUtils.preventSqlInjection,
    SanitizeUtils.sanitizeFilename
  )
})
processSecureData(@Body() dataDto: DataDto) {
  return this.dataService.process(dataDto);
}

// پاکسازی پارامترهای کوئری
@Get('search')
@Sanitize()
search(@Query('q') query: string) {
  return this.searchService.search(query);
}

// پاکسازی پارامترهای مسیر
@Get('users/:username')
@Sanitize()
getUserByUsername(@Param('username') username: string) {
  return this.usersService.findByUsername(username);
}

// پاکسازی عمیق آبجکت‌های تودرتو
@Post('shallow-sanitize')
@Sanitize({ deep: false })
processShallow(@Body() dataDto: DataDto) {
  return this.dataService.process(dataDto);
}

// استفاده مستقیم از SanitizeUtils
@Injectable()
export class ContentService {
  sanitizeContent(content: string): string {
    return SanitizeUtils.stripHtmlTags(content);
  }
  
  sanitizeFilename(filename: string): string {
    return SanitizeUtils.sanitizeFilename(filename);
  }
  
  preventSqlInjection(query: string): string {
    return SanitizeUtils.preventSqlInjection(query);
  }
}

// ثبت اینترسپتور به صورت سراسری
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalInterceptors(new SanitizeInterceptor(app.get(Reflector)));
  
  await app.listen(3000);
}
bootstrap(); */


/*  

- استفاده پایه : با استفاده از دکوراتور @Sanitize() بدون پارامتر، تمام فیلدهای رشته‌ای در بدنه درخواست، پارامترهای کوئری و مسیر پاکسازی می‌شوند.
- پاکسازی فیلدهای خاص : با مشخص کردن فیلدها در آرایه fields ، فقط فیلدهای مشخص شده پاکسازی می‌شوند.
- حفظ تگ‌های HTML : با تنظیم stripTags: false و escapeHtml: true ، تگ‌های HTML حفظ می‌شوند اما کاراکترهای خاص به انتیتی‌های HTML تبدیل می‌شوند.
- پاکسازی سفارشی : با استفاده از customSanitizer ، می‌توانید تابع پاکسازی سفارشی خود را تعریف کنید.
- ترکیب توابع پاکسازی : با استفاده از SanitizeUtils.combine ، می‌توانید چندین تابع پاکسازی را با هم ترکیب کنید.
- پاکسازی پارامترهای کوئری و مسیر : دکوراتور @Sanitize() به طور خودکار پارامترهای کوئری و مسیر را نیز پاکسازی می‌کند.
- پاکسازی عمیق : با تنظیم deep: false ، پاکسازی عمیق آبجکت‌های تودرتو غیرفعال می‌شود.
- استفاده مستقیم از SanitizeUtils : می‌توانید از توابع آماده در SanitizeUtils به صورت مستقیم در سرویس‌ها یا کنترلرها استفاده کنید.
- ثبت اینترسپتور به صورت سراسری : برای استفاده از Sanitize در کل برنامه، می‌توانید اینترسپتور را به صورت سراسری ثبت کنید.

 */