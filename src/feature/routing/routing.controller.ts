import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RoutingService } from './routing.service';

@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) { }

  // @Post()
  // create(@Body() createRoutingDto: CreateRoutingDto) {
  //   return this.routingService.create(createRoutingDto);
  // }


  @Get()
  getData(@Query() params: string[]) {
    return this.routingService.getData(params);
  }

}
