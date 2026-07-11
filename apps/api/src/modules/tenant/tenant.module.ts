import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { Store, StoreSchema } from '../../schemas/store.schema';
import { Table, TableSchema } from '../../schemas/table.schema';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Table.name, schema: TableSchema },
    ]),
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
