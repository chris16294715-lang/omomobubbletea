import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from '../../schemas/table.schema';
import { MenuModule } from '../menu/menu.module';
import { OrderModule } from '../order/order.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Table.name, schema: TableSchema }]),
    MenuModule,
    OrderModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
