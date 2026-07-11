import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantService } from './tenant.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('stores')
  @Roles('tenant_admin', 'manager')
  listStores(@CurrentUser() user: JwtPayload) {
    return this.tenantService.listStores(user.tenantId);
  }

  @Get('tables')
  @Roles('tenant_admin', 'manager')
  listTables(@CurrentUser() user: JwtPayload) {
    return this.tenantService.listTables(user.tenantId);
  }

  @Post('tables')
  @Roles('tenant_admin', 'manager')
  createTable(@CurrentUser() user: JwtPayload, @Body() dto: CreateTableDto) {
    return this.tenantService.createTable(user.tenantId, dto.storeId, dto.code);
  }
}
