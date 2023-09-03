import { GirlService } from './girl.service';
import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';

@Controller('girl')
export class GirlController {
  constructor(
    private girlService: GirlService,
    @Inject('GirlArray') private girls: string[],
  ) {
    console.log('GirlController constructor init');
  }

  @Get('/test')
  test(): any {
    return this.girls;
  }

  @Get('')
  getGirls(): any {
    return this.girlService.getGirls();
  }

  @Post('/add')
  addGirl(@Body() body: any): any {
    console.log(body, 'test');
    return this.girlService.addGirl();
  }

  @Get('/getGirlByName/:name')
  findGirlById(@Param() param: any): any {
    return this.girlService.getGirlByName(param.name);
  }

  @Get('/delete/:id')
  deleteGirl(@Param() params: any): any {
    const id: number = parseInt(params.id);
    return this.girlService.delGirl(id);
  }

  @Post('/update/:id')
  updateGirl(@Param() params: any): any {
    const id: string = params.id;
    return this.girlService.updateGirl(id);
  }

  @Get('/corstest')
  corsTest(): any {
    return {
      message: '跨域测试成功',
    };
  }
}
