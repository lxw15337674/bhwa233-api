import { UserService } from './../../feature/user/user.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}
  async validateUser(account: string, password: string): Promise<any> {
    const user = await this.userService.findOneByAccount(account);
    if (!user) {
      throw new BadRequestException('用户名不正确！');
    }
    if (user.password !== password) {
      throw new BadRequestException('密码错误！');
    }
    return user;
  }

  async createToken(account: string) {
    return this.jwtService.sign({ account }, { expiresIn: '6h' });
  }
}
