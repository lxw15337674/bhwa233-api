import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'Config',
      useValue: { shopName: '红浪漫' },
    },
  ],
  exports: [
    {
      provide: 'Config',
      useValue: { shopName: '红浪漫' },
    },
  ],
})
export class ConfigModule {}
