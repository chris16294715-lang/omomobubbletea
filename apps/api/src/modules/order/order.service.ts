import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  private calcSubtotal(items: CreateOrderDto['items']) {
    return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  }

  private async generateOrderNo(): Promise<string> {
    const date = new Date();
    const prefix =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const count = await this.orderModel.countDocuments({
      createdAt: { $gte: new Date(date.setHours(0, 0, 0, 0)) },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private generatePickupNo(): string {
    return `A${String(Math.floor(Math.random() * 900) + 100)}`;
  }

  private validatePayment(total: number, dto: CreateOrderDto) {
    if (dto.source !== 'pos' || !dto.paymentMethod) return;

    if (dto.paymentMethod === 'mixed') {
      const cash = dto.cashAmount ?? 0;
      const card = dto.cardAmount ?? 0;
      if (cash <= 0 || card <= 0) {
        throw new BadRequestException('混合支付时现金与刷卡金额均需大于 0');
      }
      if (cash + card !== total) {
        throw new BadRequestException('现金与刷卡金额之和须等于订单总额');
      }
      return;
    }

    if (!['cash', 'card'].includes(dto.paymentMethod)) {
      throw new BadRequestException('收银台仅支持现金、刷卡或混合支付');
    }
  }

  async create(tenantId: string, dto: CreateOrderDto, cashierId?: string) {
    const subtotal = this.calcSubtotal(dto.items);
    const isPos = dto.source === 'pos';
    this.validatePayment(subtotal, dto);
    const orderNo = await this.generateOrderNo();

    const paymentCash =
      dto.paymentMethod === 'mixed' ? dto.cashAmount : dto.paymentMethod === 'cash' ? subtotal : undefined;
    const paymentCard =
      dto.paymentMethod === 'mixed' ? dto.cardAmount : dto.paymentMethod === 'card' ? subtotal : undefined;

    const order = await this.orderModel.create({
      tenantId: new Types.ObjectId(tenantId),
      storeId: new Types.ObjectId(dto.storeId),
      orderNo,
      source: dto.source,
      tableId: dto.tableId ? new Types.ObjectId(dto.tableId) : undefined,
      tableCode: dto.tableCode,
      items: dto.items.map((item) => ({
        menuItemId: new Types.ObjectId(item.menuItemId),
        name: item.name,
        spec: item.spec,
        toppings: item.toppings ?? [],
        unitPrice: item.unitPrice,
        qty: item.qty,
        subtotal: item.unitPrice * item.qty,
      })),
      subtotal,
      total: subtotal,
      status: isPos ? 'paid' : 'pending',
      paymentStatus: isPos ? 'paid' : 'unpaid',
      paymentMethod: dto.paymentMethod,
      paymentCash,
      paymentCard,
      cashierId: cashierId ? new Types.ObjectId(cashierId) : undefined,
      customerNote: dto.customerNote,
      pickupNo: this.generatePickupNo(),
      paidAt: isPos ? new Date() : undefined,
    });

    return order;
  }

  async findById(tenantId: string, id: string) {
    const order = await this.orderModel.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async listToday(tenantId: string, storeId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
      createdAt: { $gte: start },
    };
    if (storeId) filter.storeId = new Types.ObjectId(storeId);
    return this.orderModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto) {
    const update: Record<string, unknown> = { status: dto.status };
    if (dto.paymentMethod) update.paymentMethod = dto.paymentMethod;
    if (dto.status === 'paid') {
      update.paymentStatus = 'paid';
      update.paidAt = new Date();
    }
    if (dto.status === 'completed') update.completedAt = new Date();
    if (dto.status === 'refunded') update.paymentStatus = 'refunded';

    const order = await this.orderModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      update,
      { new: true },
    );
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async markPaid(tenantId: string, id: string, paymentMethod?: string) {
    return this.updateStatus(tenantId, id, {
      status: 'paid',
      paymentMethod: paymentMethod as UpdateOrderStatusDto['paymentMethod'],
    });
  }
}
