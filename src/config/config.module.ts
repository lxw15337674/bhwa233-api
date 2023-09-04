import { DynamicModule, Module } from '@nestjs/common';

@Module({})
export class ConfigModule {
  static forRoot(option: string): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'Config',
          useValue: { shopName: '红浪漫' + option },
        },
      ],
      exports: [
        {
          provide: 'Config',
          useValue: { shopName: '红浪漫' + option },
        },
      ],
    };
  }
}
