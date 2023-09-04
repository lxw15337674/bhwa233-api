import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Result } from 'src/common/interface/result';
import { AuthService } from 'src/core/auth/auth.service';
import { User } from './entities/user.entity';
import { Roles } from 'src/common/roles/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/core/guards/roles/roles.guard';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  /**
   * 用户登录成功后，返回的 data 是授权令牌；
   * 在调用有 @UseGuards(AuthGuard()) 装饰的路由时，会检查当前请求头中是否包含 Authorization: Bearer xxx 授权令牌，
   * 其中 Authorization 是用于告诉服务端本次请求有令牌，并且令牌前缀是 Bearer，而令牌的具体内容是登录之后返回的 data(accessToken)。
   */
  @Post('login')
  async login(
    @Body() body: { account: string; password: string },
  ): Promise<Result> {
    await this.userService.login(body.account, body.password);
    const accessToken = await this.authService.createToken(body.account);
    return { code: 200, message: '登录成功', data: accessToken };
  }

  @Post('register')
  async register(@Body() user: User) {
    await this.userService.register(user);
    return { code: 200, message: '注册成功' };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(AuthGuard(), RolesGuard)
  async remove(@Param('id') id: number) {
    await this.userService.remove(id);
    return { code: 200, message: '删除成功' };
  }
}
