import {
  HttpException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoUtil } from '../../common/utils/crypto.utils';
import { User } from './entities/user.entity';
import { GithubUserInfo, RegisterUser } from 'src/common/interface/result';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserService implements OnModuleInit {
  async onModuleInit() {
    if (await this.findOneByAccount('admin')) return;
    const admin = this.userRepo.create({
      account: 'admin',
      password: this.cryptoUtil.encryptPassword('i_am_admin_!'),
      name: '系统管理员',
      role: 'admin',
    });
    await this.userRepo.save(admin);
  }

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,
    private readonly httpService: HttpService,
  ) {}

  /**
   * 用户登录
   */
  async login(account: string, password: string) {
    const user = await this.findOneByAccount(account);
    if (!user) throw new HttpException('用户不存在', 406);
    if (!this.cryptoUtil.checkPassword(password, user.password)) {
      throw new HttpException('登录密码有误', 406);
    }
    return user;
  }

  /**
   * 用户注册
   */
  async register({ account, password, name = account }: RegisterUser) {
    const existing = await this.findOneByAccount(account);
    if (existing) throw new HttpException('用户已存在', 406);
    const user = this.userRepo.create({
      account,
      password: this.cryptoUtil.encryptPassword(password),
      name,
    });
    const newUser = await this.userRepo.save(user);
    return newUser;
  }

  // 拿到用户id，如果存在则返回用户，不存在则创建用户
  async OauthLogin(access_token: string) {
    const getInfo = this.httpService.get<GithubUserInfo>(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: 'Bearer ' + access_token,
        },
      },
    );
    const userInfo = await (await lastValueFrom(getInfo)).data;
    const id = userInfo.id.toString();
    const user = await this.userRepo.findOne({
      where: { id },
    });
    if (!user) {
      let newUser = await this.userRepo.create({
        id,
        password: this.cryptoUtil.randomPassword(),
        account: userInfo.login,
        name: userInfo.name,
      });
      newUser = await this.userRepo.save(newUser);
      return newUser;
    }
    return user;
  }

  /**
   * 删除用户
   */
  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new HttpException('用户不存在', 406);
    await this.userRepo.remove(user);
  }

  /**
   * 更新用户
   */
  async update(id: string, updateInput: User) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new HttpException('用户不存在', 406);
    await this.userRepo.update(id, updateInput);
  }

  /**
   * 根据账号查找用户
   */
  async findOneByAccount(account: string) {
    return await this.userRepo.findOne({ where: { account } });
  }

  /**
   * 查询所有用户
   */
  async findAll() {
    return await this.userRepo.find();
  }
}
