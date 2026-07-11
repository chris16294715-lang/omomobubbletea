import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: 'basic' })
  plan: string;

  @Prop({ type: Object, default: {} })
  settings: Record<string, unknown>;

  @Prop({ default: 'active' })
  status: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
