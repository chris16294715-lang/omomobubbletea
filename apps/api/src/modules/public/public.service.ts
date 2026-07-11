import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from '../../schemas/table.schema';
import { MenuService } from '../menu/menu.service';
import { OrderService } from '../order/order.service';
import { CreateOrderDto } from '../order/order.dto';

@Injectable()
export class PublicService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    private menuService: MenuService,
    private orderService: OrderService,
  ) {}

  private async resolveTable(token: string) {
    if (!token) throw new UnauthorizedException('Missing token');
    const table = await this.tableModel.findOne({ qrToken: token });
    if (!table) throw new NotFoundException('Invalid QR code');
    return table;
  }

  async getMenuByToken(token: string) {
    const table = await this.resolveTable(token);
    const menu = await this.menuService.getPublicMenu(
      table.tenantId.toString(),
      table.storeId.toString(),
    );
    return {
      table: { code: table.code, id: table._id },
      ...menu,
    };
  }

  async createOrderByToken(token: string, dto: CreateOrderDto) {
    const table = await this.resolveTable(token);
    return this.orderService.create(table.tenantId.toString(), {
      ...dto,
      source: 'scan',
      storeId: table.storeId.toString(),
      tableId: table._id.toString(),
      tableCode: table.code,
    });
  }

  async getOrderByToken(token: string, orderId: string) {
    const table = await this.resolveTable(token);
    const order = await this.orderService.findById(table.tenantId.toString(), orderId);
    if (order.tableId?.toString() !== table._id.toString()) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async payOrderByToken(token: string, orderId: string, paymentMethod = 'wechat') {
    const table = await this.resolveTable(token);
    const order = await this.orderService.findById(table.tenantId.toString(), orderId);
    if (order.tableId?.toString() !== table._id.toString()) {
      throw new NotFoundException('Order not found');
    }
    return this.orderService.markPaid(table.tenantId.toString(), orderId, paymentMethod);
  }
}
