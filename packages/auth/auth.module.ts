import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { User } from '../database/ORM/typeOrm/entities/user.entity';
import { RefreshToken } from '../database/ORM/typeOrm/entities/refresh-token.entity';
import { Role } from '../database/ORM/typeOrm/entities/role.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Role]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your_jwt_secret_key_change_this_in_production',
        signOptions: { 
          expiresIn: configService.get('JWT_EXPIRES_IN') || '1h' 
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy, 
    LocalStrategy,
    {
      provide: 'AUTH_OPTIONS',
      useValue: {
        jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret_key_change_this_in_production',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}