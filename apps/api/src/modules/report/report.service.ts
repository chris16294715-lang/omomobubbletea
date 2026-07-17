import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../schemas/order.schema';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  private summarizeOrders(orders: OrderDocument[]) {
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const bySource = { scan: 0, pos: 0 };
    const byPayment: Record<string, number> = {};

    for (const order of orders) {
      bySource[order.source as 'scan' | 'pos'] += order.total;
      if (order.paymentMethod === 'mixed' && order.paymentCash != null && order.paymentCard != null) {
        byPayment.cash = (byPayment.cash ?? 0) + order.paymentCash;
        byPayment.card = (byPayment.card ?? 0) + order.paymentCard;
      } else {
        const method = order.paymentMethod ?? 'unknown';
        byPayment[method] = (byPayment[method] ?? 0) + order.total;
      }
    }

    return {
      orderCount: orders.length,
      revenue,
      averageOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
      bySource,
      byPayment,
    };
  }

  private parseDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('日期格式无效，请使用 YYYY-MM-DD');
    }
    if (start > end) {
      throw new BadRequestException('开始日期不能晚于结束日期');
    }

    return { start, end };
  }

  private formatLocalDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async getDailyReport(tenantId: string, storeId: string, dateStr?: string) {
    const day = dateStr ?? this.formatLocalDate(new Date());
    return this.getSalesReport(tenantId, storeId, day, day);
  }

  async getSalesReport(
    tenantId: string,
    storeId: string,
    startDate: string,
    endDate: string,
    expand?: string,
  ) {
    const { start, end } = this.parseDateRange(startDate, endDate);

    const orders = await this.findPaidOrdersInRange(tenantId, storeId, start, end);

    const result: Record<string, unknown> = {
      startDate,
      endDate,
      ...this.summarizeOrders(orders),
    };

    if (!expand) return result;

    const parts = new Set(
      expand.split(',').map((p) => p.trim()).filter(Boolean),
    );

    if (parts.has('orders') || parts.has('all')) {
      result.orders = await this.mapOrdersForReport(orders);
    }
    if (parts.has('dailyTrend') || parts.has('all')) {
      result.dailyTrend = this.buildDailyTrend(start, end, orders);
    }
    if (parts.has('aov') || parts.has('all')) {
      result.aovDetail = this.buildAovDetail(orders);
    }

    return result;
  }

  private mapOrdersForReport(orders: OrderDocument[]) {
    return orders.map((o) => ({
      _id: o._id.toString(),
      orderNo: o.orderNo,
      pickupNo: o.pickupNo,
      total: o.total,
      source: o.source,
      paymentMethod: o.paymentMethod,
      paymentCash: o.paymentCash,
      paymentCard: o.paymentCard,
      itemCount: o.items.reduce((sum, item) => sum + item.qty, 0),
      items: o.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        subtotal: item.subtotal,
      })),
      createdAt: o.createdAt,
    }));
  }

  private buildDailyTrend(start: Date, end: Date, orders: OrderDocument[]) {
    const byDay = new Map<string, OrderDocument[]>();
    for (const order of orders) {
      const day = this.formatLocalDate(order.createdAt!);
      const list = byDay.get(day) ?? [];
      list.push(order);
      byDay.set(day, list);
    }

    const days: { date: string; orderCount: number; revenue: number; averageOrderValue: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const day = this.formatLocalDate(cursor);
      const dayOrders = byDay.get(day) ?? [];
      const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
      days.push({
        date: day,
        orderCount: dayOrders.length,
        revenue,
        averageOrderValue: dayOrders.length ? Math.round(revenue / dayOrders.length) : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  private buildAovDetail(orders: OrderDocument[]) {
    if (!orders.length) {
      return {
        min: 0,
        max: 0,
        median: 0,
        averageOrderValue: 0,
        orders: [],
      };
    }

    const totals = orders.map((o) => o.total).sort((a, b) => a - b);
    const mid = Math.floor(totals.length / 2);
    const median =
      totals.length % 2 === 0
        ? Math.round((totals[mid - 1] + totals[mid]) / 2)
        : totals[mid];

    return {
      min: totals[0],
      max: totals[totals.length - 1],
      median,
      averageOrderValue: Math.round(totals.reduce((s, t) => s + t, 0) / totals.length),
      orders: orders
        .slice()
        .sort((a, b) => b.total - a.total)
        .map((o) => ({
          _id: o._id.toString(),
          orderNo: o.orderNo,
          pickupNo: o.pickupNo,
          total: o.total,
          paymentMethod: o.paymentMethod,
          createdAt: o.createdAt,
        })),
    };
  }

  private findPaidOrdersInRange(
    tenantId: string,
    storeId: string,
    start: Date,
    end: Date,
  ) {
    return this.orderModel
      .find({
        tenantId: new Types.ObjectId(tenantId),
        storeId: new Types.ObjectId(storeId),
        createdAt: { $gte: start, $lte: end },
        paymentStatus: 'paid',
      })
      .sort({ createdAt: -1 });
  }

  async getOrdersInRange(
    tenantId: string,
    storeId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const orders = await this.findPaidOrdersInRange(tenantId, storeId, start, end);
    return this.mapOrdersForReport(orders);
  }

  async getDailyTrend(
    tenantId: string,
    storeId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const orders = await this.findPaidOrdersInRange(tenantId, storeId, start, end);
    return this.buildDailyTrend(start, end, orders);
  }

  async getAovDetail(
    tenantId: string,
    storeId: string,
    startDate: string,
    endDate: string,
  ) {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const orders = await this.findPaidOrdersInRange(tenantId, storeId, start, end);
    return this.buildAovDetail(orders);
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
