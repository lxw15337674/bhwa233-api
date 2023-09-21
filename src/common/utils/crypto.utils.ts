import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class CryptoUtil {
  /**
   * 加密登录密码
   *
   * @param password 登录密码
   */
  encryptPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * 检查登录密码是否正确
   *
   * @param password 登录密码
   * @param encryptedPassword 加密后的密码
   */
  checkPassword(password: string, encryptedPassword: string): boolean {
    const currentPass = this.encryptPassword(password);
    if (currentPass === encryptedPassword) {
      return true;
    }
    return false;
  }
  // 随机生成密码
  randomPassword(): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const maxPos = chars.length;
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return this.encryptPassword(pwd);
  }
}
