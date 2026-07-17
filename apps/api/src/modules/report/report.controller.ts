import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('admin/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get('daily')
  @Roles('tenant_admin', 'manager')
  daily(
    @CurrentUser() user: JwtPayload,
    @Query('storeId') storeId?: string,
    @Query('date') date?: string,
  ) {
    const sid = storeId ?? user.storeIds[0];
    return this.reportService.getDailyReport(user.tenantId, sid, date);
  }

  @Get('sales')
  @Roles('tenant_admin', 'manager')
  sales(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('storeId') storeId?: string,
    @Query('expand') expand?: string,
  ) {
    const sid = storeId ?? user.storeIds[0];
    return this.reportService.getSalesReport(user.tenantId, sid, startDate, endDate, expand);
  }

  @Get('orders')
  @Roles('tenant_admin', 'manager')
  orders(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('storeId') storeId?: string,
  ) {
    const sid = storeId ?? user.storeIds[0];
    return this.reportService.getOrdersInRange(user.tenantId, sid, startDate, endDate);
  }

  @Get('daily-trend')
  @Roles('tenant_admin', 'manager')
  dailyTrend(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('storeId') storeId?: string,
  ) {
    const sid = storeId ?? user.storeIds[0];
    return this.reportService.getDailyTrend(user.tenantId, sid, startDate, endDate);
  }

  @Get('aov-detail')
  @Roles('tenant_admin', 'manager')
  aovDetail(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('storeId') storeId?: string,
  ) {
    const sid = storeId ?? user.storeIds[0];
    return this.reportService.getAovDetail(user.tenantId, sid, startDate, endDate);
  }

  @Get('top-items')
  @Roles('tenant_admin', 'manager')
  topItems(
    @CurrentUser() user: JwtPayload,
    @Query('storeId') storeId?: string,
    @Query('days') days?: string,
  ) {
    const sid = storeId ?? user.storeIds[0];
    return this.reportService.getTopItems(user.tenantId, sid, Number(days) || 7);
  }
}
