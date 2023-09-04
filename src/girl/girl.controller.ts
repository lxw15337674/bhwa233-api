import { BoyService } from './../boy/boy.service';
import { GirlService } from './girl.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
  ParseIntPipe,
} from '@nestjs/common';

@Controller('girl')
export class GirlController {
  constructor(
    private girlService: GirlService,
    private BoyService: BoyService,
    @Inject('GirlArray') private girls: string[],
    @Inject('Config') private shopName: string,
  ) {}
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
  findGirlByName(@Param('name') param: any): any {
    return this.girlService.getGirlByName(param.name);
  }

  @Get('/getGirlById/:id')
  findGirlById(@Param('id', ParseIntPipe) id: number): any {
    return this.girlService.getGirlById(id);
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

  @Get('/findAllBoy')
  findBoy(): any {
    return this.BoyService.findAll();
  }

  @Get('/getConfig')
  getConfig(): any {
    return this.shopName;
  }
}
