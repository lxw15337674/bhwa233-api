import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Inject,
  UseGuards,
  Get,
  Req,
  Query,
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { IUser } from 'src/common/interface/result';
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
  ) { }

  /**
   * 用户登录成功后，返回的 data 是授权令牌；
   * 在调用有 @UseGuards(AuthGuard()) 装饰的路由时，会检查当前请求头中是否包含 Authorization: Bearer xxx 授权令牌，
   * 其中 Authorization 是用于告诉服务端本次请求有令牌，并且令牌前缀是 Bearer，而令牌的具体内容是登录之后返回的 data(accessToken)。
   */
  @Post('login')
  async login(@Body() body: IUser): Promise<string> {
    const user = await this.userService.login(body.account, body.password);
    const accessToken = await this.authService.createToken(user);
    new Logger('login').log(`用户登录成功！${user.account}`);
    return accessToken;
  }

  @Post('register')
  async register(@Body() user: User) {
    const newUser = await this.userService.register(user);
    const accessToken = await this.authService.createToken(newUser);
    return accessToken;
  }

  // 三方登录
  @Get('oauth')
  async oauth(@Query('access_token') access_token: string) {
    const user = await this.userService.OauthLogin(access_token);
    const accessToken = await this.authService.createToken(user);
    return accessToken;
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(AuthGuard(), RolesGuard)
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return null;
  }

  /**
   * 获取所有用户
   */
  @Get('findAll')
  @Roles('admin')
  @UseGuards(AuthGuard('jwt'))
  async findAll() {
    const users = await this.userService.findAll();
    return users;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('getInfo')
  async getInfo(@Req() req: any) {
    return req.user;
  }
}
