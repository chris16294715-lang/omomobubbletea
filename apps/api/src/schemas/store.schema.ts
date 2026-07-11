import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

@Schema({ timestamps: true })
export class Store {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop({ default: 'Asia/Shanghai' })
  timezone: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
