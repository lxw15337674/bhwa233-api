import { GirlService } from './girl.service';
import { Controller, Get, Post, Query, Body, Param, Headers } from '@nestjs/common';

@Controller('girl')
export class GirlController {
  constructor(private girlService: GirlService) {
    console.log('GirlController constructor');
  }
  @Get()
  getGirls(): any {
    return this.girlService.getGirls();
  }

  @Get('/getGirlById')
  getGirlById(@Query() query: any): any {
    console.log(query);
    return this.girlService.getGirlById(parseInt(query.id));
  }

  @Post('/add')
  addGirl(@Body() body: any): any {
    console.log(body, 'test');
    return this.girlService.addGirl();
  }

  @Get('/findGirlById/:id')
  findGirlById(@Param() param: any, @Headers() header: any): any {
    const id: number = parseInt(param.id);
    console.log(param.id);
    console.log(header);

    return this.girlService.getGirlById(id);
  }
}
