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
export class MenuToppingOption {
  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ default: 1 })
  maxQty: number;
}

@Schema({ _id: false })
export class MenuToppingCatalog {
  @Prop({ type: I18nTextSchema, required: true })
  name: I18nText;

  /** single=组内单选, multiple=可多选及多份 */
  @Prop({ default: 'multiple', enum: ['single', 'multiple'] })
  selectionMode: 'single' | 'multiple';

  @Prop({ type: [MenuToppingOption], default: [] })
  options: MenuToppingOption[];
}

/** @deprecated 旧版扁平加料，读取时自动迁移为 toppingCatalogs */
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

  @Prop({ type: [MenuToppingCatalog], default: [] })
  toppingCatalogs: MenuToppingCatalog[];

  /** @deprecated 使用 toppingCatalogs */
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
