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
