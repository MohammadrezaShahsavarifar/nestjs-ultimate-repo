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
// استفاده مستقیم از SanitizeUtils
import { SanitizeUtils } from '../../packages/core/utils/sanitize.utils';

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


// در فایل main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SanitizeInterceptor } from './packages/core/interceptors/sanitize.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ثبت اینترسپتور به صورت سراسری
  app.useGlobalInterceptors(new SanitizeInterceptor(app.get(Reflector)));
  
  await app.listen(3000);
}
bootstrap();