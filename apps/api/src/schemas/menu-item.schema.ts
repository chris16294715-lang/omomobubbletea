import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { I18nText, I18nTextSchema } from './i18n.schema';

export type MenuItemDocument = HydratedDocument<MenuItem>;

@Schema({ _id: false })
export class MenuSpec {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  priceDelta: number;
}

@Schema({ _id: false })
export class MenuTopping {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ default: 1 })
  maxQty: number;
}

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', index: true })
  storeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: I18nTextSchema, required: true })
  name: I18nText;

  @Prop({ type: I18nTextSchema })
  description?: I18nText;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ type: [MenuSpec], default: [] })
  specs: MenuSpec[];

  @Prop({ type: [MenuTopping], default: [] })
  toppings: MenuTopping[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: 0 })
  sort: number;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
