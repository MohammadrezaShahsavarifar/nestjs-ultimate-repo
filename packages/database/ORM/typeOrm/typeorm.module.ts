import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule as NestTypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions as NestTypeOrmOptions } from '@nestjs/typeorm';

// Use the NestJS TypeORM module options directly
export type TypeOrmModuleOptions = NestTypeOrmOptions;

@Module({})
export class TypeOrmModule {
  // Static method for root configuration
  static forRoot(options: TypeOrmModuleOptions): DynamicModule {
    return {
      module: TypeOrmModule,
      imports: [NestTypeOrmModule.forRoot(options)],
      exports: [NestTypeOrmModule],
    };
  }

  // Static method for async root configuration
  static forRootAsync(options: TypeOrmModuleAsyncOptions): DynamicModule {
    return {
      module: TypeOrmModule,
      imports: [NestTypeOrmModule.forRootAsync(options)],
      exports: [NestTypeOrmModule],
    };
  }

  // Static method for using specific entities in other modules
  static forFeature(entities: any[]): DynamicModule {
    return {
      module: TypeOrmModule,
      imports: [NestTypeOrmModule.forFeature(entities)],
      exports: [NestTypeOrmModule],
    };
  }
}