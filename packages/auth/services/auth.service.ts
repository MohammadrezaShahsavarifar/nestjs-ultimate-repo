import { Injectable, Inject, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import {  RefreshToken } from '../../database/ORM/typeOrm/entities/refresh-token.entity';
import { User } from '../../database/ORM/typeOrm/entities/user.entity';
import {  Role } from '../../database/ORM/typeOrm/entities/role.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('AUTH_OPTIONS') private options: any,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { username },
      relations: ['roles', 'roles.permissions']
    });
    
    if (user && await this.comparePasswords(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto) {
    // بررسی وجود کاربر
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: registerDto.username },
        { email: registerDto.email }
      ]
    });
    
    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }
    
    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // یافتن یا ایجاد نقش پیش‌فرض
    let defaultRole = await this.roleRepository.findOne({ where: { name: 'user' } });
    
    if (!defaultRole) {
      // ایجاد نقش پیش‌فرض اگر وجود نداشت
      defaultRole = this.roleRepository.create({
        name: 'user',
        description: 'Regular user with limited access'
      });
      await this.roleRepository.save(defaultRole);
    }
    
    // ایجاد کاربر جدید
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      roles: [defaultRole]
    });
    
    await this.userRepository.save(user);
    
    // حذف رمز عبور از پاسخ
    const { password, ...result } = user;
    return result;
  }

  async refreshToken(token: string) {
    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { token, isRevoked: false },
      relations: ['user', 'user.roles', 'user.roles.permissions'],
    });

    if (!refreshTokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (this.isTokenExpired(refreshTokenEntity.expiresAt)) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = refreshTokenEntity.user;
    
    // ابطال توکن بازیابی فعلی
    await this.refreshTokenRepository.delete(refreshTokenEntity.id);
    
    // ایجاد توکن‌های جدید
    return this.generateTokens(user);
  }

  async logout(userId: number) {
    // ابطال همه توکن‌های بازیابی کاربر
    await this.refreshTokenRepository.delete({ userId });
    
    return { success: true };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // بررسی رمز عبور فعلی
    const isPasswordValid = await this.comparePasswords(changePasswordDto.oldPassword, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid current password');
    }
    
    // هش کردن رمز عبور جدید
    const hashedPassword = await this.hashPassword(changePasswordDto.newPassword);
    
    // بروزرسانی رمز عبور
    user.password = hashedPassword;
    await this.userRepository.save(user);
    
    // ابطال همه توکن‌های بازیابی کاربر
    await this.refreshTokenRepository.delete({ userId });
    
    return { success: true };
  }

  async getUserProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const { password, ...result } = user;
    return result;
  }

  private async generateTokens(user: User) {
    const payload = { 
      sub: user.id, 
      username: user.username,
      roles: user.roles?.map(role => role.name) || [],
      permissions: user.roles?.flatMap(role => 
        role.permissions?.map(permission => permission.name) || []
      ) || []
    };
    
    // ایجاد توکن دسترسی
    const accessToken = this.jwtService.sign(payload);
    
    // ایجاد توکن بازیابی
    const refreshToken = await this.generateRefreshToken(user.id);
    
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
    };
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const token = uuidv4();
    const expiresIn = this.options.refreshTokenExpiresIn || 7 * 24 * 60 * 60; // پیش‌فرض: یک هفته
    
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    });
    
    await this.refreshTokenRepository.save(refreshToken);
    
    return token;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }
  
  /**
   * درخواست بازیابی رمز عبور
   * ایجاد توکن بازیابی و ذخیره آن برای کاربر
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    
    // حتی اگر کاربر پیدا نشد، پیام موفقیت برگردان (برای جلوگیری از نشت اطلاعات)
    if (!user) {
      return { 
        success: true, 
        message: 'If a user with that email exists, a password reset link has been sent.' 
      };
    }

    // ایجاد توکن بازیابی
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // منقضی شدن بعد از 1 ساعت
    
    // ذخیره توکن بازیابی در دیتابیس
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await this.userRepository.save(user);
    
    // در اینجا باید ایمیل ارسال شود (پیاده‌سازی سرویس ایمیل جداگانه نیاز است)
    // برای مثال: await this.mailService.sendPasswordResetEmail(user.email, resetToken);
    
    // لاگ کردن لینک بازیابی برای تست (در محیط واقعی حذف شود)
    console.log(`Password reset link: ${this.options.frontendUrl || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
    
    return { 
      success: true, 
      message: 'Password reset link has been sent to your email.' 
    };
  }
  
  /**
   * بررسی اعتبار توکن بازیابی رمز عبور
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean }> {
    const user = await this.userRepository.findOne({
      where: { resetToken: token }
    });
    
    if (!user || !user.resetTokenExpiry) {
      return { valid: false };
    }
    
    // بررسی انقضای توکن
    if (this.isTokenExpired(user.resetTokenExpiry)) {
      return { valid: false };
    }
    
    return { valid: true };
  }
  
  /**
   * بازنشانی رمز عبور با استفاده از توکن
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({
      where: { resetToken: token }
    });
    
    if (!user || !user.resetTokenExpiry) {
      throw new NotFoundException('Invalid reset token');
    }
    
    // بررسی انقضای توکن
    if (this.isTokenExpired(user.resetTokenExpiry)) {
      throw new UnauthorizedException('Reset token has expired');
    }
    
    // هش کردن رمز عبور جدید
    const hashedPassword = await this.hashPassword(newPassword);
    
    // بروزرسانی رمز عبور و پاک کردن توکن بازیابی
    user.password = hashedPassword;
    user.resetToken = null as any; // استفاده از type assertion برای رفع خطا
    user.resetTokenExpiry = null as any; // استفاده از type assertion برای رفع خطا
    await this.userRepository.save(user);
    
    // ابطال همه توکن‌های بازیابی کاربر
    await this.refreshTokenRepository.delete({ userId: user.id });
    
    return { success: true };
  }
}