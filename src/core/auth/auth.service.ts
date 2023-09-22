import { UserService } from './../../feature/user/user.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/common/interface/result';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}
  async validateUser(account: string, password: string): Promise<any> {
    const user = await this.userService.findOneByAccount(account);
    if (!user) {
      throw new UnauthorizedException('用户名不正确！');
    }
    if (user.password !== password) {
      throw new UnauthorizedException('密码错误！');
    }
    return user;
  }

  async createToken(user: IUser) {
    return this.jwtService.sign(
      {
        account: user.account,
        password: user.password,
      },
      { expiresIn: '6h' },
    );
  }
}
