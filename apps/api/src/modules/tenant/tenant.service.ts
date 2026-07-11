import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Store, StoreDocument } from '../../schemas/store.schema';
import { Table, TableDocument } from '../../schemas/table.schema';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
  ) {}

  listStores(tenantId: string) {
    return this.storeModel.find({ tenantId: new Types.ObjectId(tenantId), isActive: true }).lean();
  }

  listTables(tenantId: string) {
    return this.tableModel.find({ tenantId: new Types.ObjectId(tenantId) }).lean();
  }

  createTable(tenantId: string, storeId: string, code: string) {
    return this.tableModel.create({
      tenantId: new Types.ObjectId(tenantId),
      storeId: new Types.ObjectId(storeId),
      code,
      qrToken: randomUUID(),
    });
  }
}
