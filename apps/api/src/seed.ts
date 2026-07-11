import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Tenant } from './schemas/tenant.schema';
import { Store } from './schemas/store.schema';
import { User } from './schemas/user.schema';
import { Category } from './schemas/category.schema';
import { MenuItem } from './schemas/menu-item.schema';
import { Table } from './schemas/table.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const tenantModel = app.get<Model<Tenant>>(getModelToken(Tenant.name));
  const storeModel = app.get<Model<Store>>(getModelToken(Store.name));
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const menuItemModel = app.get<Model<MenuItem>>(getModelToken(MenuItem.name));
  const tableModel = app.get<Model<Table>>(getModelToken(Table.name));

  await Promise.all([
    tenantModel.deleteMany({}),
    storeModel.deleteMany({}),
    userModel.deleteMany({}),
    categoryModel.deleteMany({}),
    menuItemModel.deleteMany({}),
    tableModel.deleteMany({}),
  ]);

  const tenant = await tenantModel.create({
    name: '演示奶茶店',
    slug: 'demo-milk-tea',
    plan: 'basic',
    settings: { currency: 'CNY' },
  });

  const store = await storeModel.create({
    tenantId: tenant._id,
    name: '中山路店',
    address: '中山路 100 号',
    phone: '13800000000',
  });

  const passwordHash = await bcrypt.hash('admin123', 10);
  await userModel.create([
    {
      tenantId: tenant._id,
      email: 'admin@demo.com',
      passwordHash,
      name: '店长',
      role: 'tenant_admin',
      storeIds: [store._id],
    },
    {
      tenantId: tenant._id,
      email: 'cashier@demo.com',
      passwordHash,
      name: '收银员',
      role: 'cashier',
      storeIds: [store._id],
    },
  ]);

  const category = await categoryModel.create({
    tenantId: tenant._id,
    storeId: store._id,
    name: '经典奶茶',
    sort: 1,
  });

  const menuItem = await menuItemModel.create({
    tenantId: tenant._id,
    storeId: store._id,
    categoryId: category._id,
    name: '珍珠奶茶',
    description: '经典口味',
    basePrice: 1200,
    specs: [
      { name: '中杯', priceDelta: 0 },
      { name: '大杯', priceDelta: 300 },
    ],
    toppings: [{ name: '珍珠', price: 200, maxQty: 2 }],
    tags: ['热销'],
  });

  const table = await tableModel.create({
    tenantId: tenant._id,
    storeId: store._id,
    code: 'A01',
    qrToken: randomUUID(),
  });

  console.log('Seed completed!');
  console.log('--- Demo accounts ---');
  console.log('Admin:   admin@demo.com / admin123');
  console.log('Cashier: cashier@demo.com / admin123');
  console.log('--- IDs ---');
  console.log('Tenant:', tenant._id.toString());
  console.log('Store:', store._id.toString());
  console.log('MenuItem:', menuItem._id.toString());
  console.log('Table QR token:', table.qrToken);
  console.log('Scan menu URL: /v1/public/menu?token=' + table.qrToken);

  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
