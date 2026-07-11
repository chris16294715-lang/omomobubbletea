import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('pos/orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrderPosController {
  constructor(private orderService: OrderService) {}

  @Post()
  @Roles('cashier', 'manager', 'tenant_admin')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.orderService.create(user.tenantId, { ...dto, source: 'pos' }, user.sub);
  }

  @Get('today')
  @Roles('cashier', 'manager', 'tenant_admin')
  listToday(@CurrentUser() user: JwtPayload, @Query('storeId') storeId?: string) {
    const sid = storeId ?? user.storeIds[0];
    return this.orderService.listToday(user.tenantId, sid);
  }

  @Patch(':id/status')
  @Roles('cashier', 'manager', 'tenant_admin')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(user.tenantId, id, dto);
  }
}
