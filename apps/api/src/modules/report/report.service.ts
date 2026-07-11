import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  async getDailyReport(tenantId: string, storeId: string, dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const orders = await this.orderModel.find({
      tenantId: new Types.ObjectId(tenantId),
      storeId: new Types.ObjectId(storeId),
      createdAt: { $gte: start, $lte: end },
      paymentStatus: 'paid',
    });

    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const bySource = { scan: 0, pos: 0 };
    const byPayment: Record<string, number> = {};

    for (const order of orders) {
      bySource[order.source as 'scan' | 'pos'] += order.total;
      const method = order.paymentMethod ?? 'unknown';
      byPayment[method] = (byPayment[method] ?? 0) + order.total;
    }

    return {
      date: start.toISOString().slice(0, 10),
      orderCount: orders.length,
      revenue,
      bySource,
      byPayment,
    };
  }

  async getTopItems(tenantId: string, storeId: string, days = 7) {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const result = await this.orderModel.aggregate([
      {
        $match: {
          tenantId: new Types.ObjectId(tenantId),
          storeId: new Types.ObjectId(storeId),
          createdAt: { $gte: start },
          paymentStatus: 'paid',
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          qty: { $sum: '$items.qty' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]);

    return result;
  }
}
