import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateOrderDto } from '../order/order.dto';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Get('menu')
  getMenu(@Query('token') token: string, @Query('lang') lang?: string) {
    const locale = lang === 'en' ? 'en' : 'zh';
    return this.publicService.getMenuByToken(token, locale);
  }

  @Post('orders')
  createOrder(@Query('token') token: string, @Body() dto: CreateOrderDto) {
    return this.publicService.createOrderByToken(token, dto);
  }

  @Get('orders/:id')
  getOrder(@Query('token') token: string, @Param('id') id: string) {
    return this.publicService.getOrderByToken(token, id);
  }

  @Post('orders/:id/pay')
  payOrder(
    @Query('token') token: string,
    @Param('id') id: string,
    @Body('paymentMethod') paymentMethod?: string,
  ) {
    return this.publicService.payOrderByToken(token, id, paymentMethod);
  }
}
