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
  }

  /**
   * 用户注册
   */
  async register({ account, password, name = account }: User) {
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

  /**
   * 删除用户
   */
  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new HttpException('用户不存在', 406);
    await this.userRepo.remove(user);
  }

  /**
   * 更新用户
   */
  async update(id: number, updateInput: User) {
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
