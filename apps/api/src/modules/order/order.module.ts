import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { OrderPosController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }])],
  controllers: [OrderPosController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
