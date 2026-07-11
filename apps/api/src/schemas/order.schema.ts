import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItemTopping {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 1 })
  qty: number;
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'MenuItem' })
  menuItemId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  spec?: string;

  @Prop({ type: [OrderItemTopping], default: [] })
  toppings: OrderItemTopping[];

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ required: true })
  subtotal: number;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  orderNo: string;

  @Prop({ required: true, enum: ['scan', 'pos'] })
  source: string;

  @Prop({ type: Types.ObjectId, ref: 'Table' })
  tableId?: Types.ObjectId;

  @Prop()
  tableCode?: string;

  @Prop({ type: [OrderItem], default: [] })
  items: OrderItem[];

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({
    default: 'pending',
    enum: ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled', 'refunded'],
  })
  status: string;

  @Prop({ enum: ['wechat', 'alipay', 'cash', 'card'] })
  paymentMethod?: string;

  @Prop({ default: 'unpaid', enum: ['unpaid', 'paid', 'refunded'] })
  paymentStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cashierId?: Types.ObjectId;

  @Prop()
  customerNote?: string;

  @Prop()
  pickupNo?: string;

  @Prop()
  paidAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ tenantId: 1, storeId: 1, createdAt: -1 });
