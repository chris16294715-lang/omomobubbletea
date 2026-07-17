import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemInputDto {
  @IsString()
  menuItemId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  spec?: string;

  @IsOptional()
  toppings?: { catalog?: string; name: string; qty?: number }[];

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  @Min(1)
  qty: number;
}

export class CreateOrderDto {
  @IsString()
  storeId: string;

  @IsEnum(['scan', 'pos'])
  source: 'scan' | 'pos';

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsString()
  tableCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsOptional()
  @IsString()
  customerNote?: string;

  @IsOptional()
  @IsEnum(['wechat', 'alipay', 'cash', 'card', 'mixed'])
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cardAmount?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled', 'refunded'])
  status: string;

  @IsOptional()
  @IsEnum(['wechat', 'alipay', 'cash', 'card', 'mixed'])
  paymentMethod?: string;
}
