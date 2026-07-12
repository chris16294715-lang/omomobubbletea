import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenuService } from './menu.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateCategoryDto, CreateMenuItemDto, UpdateCategoryDto, UpdateMenuItemDto } from './menu.dto';

@Controller('admin/menu')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MenuAdminController {
  constructor(private menuService: MenuService) {}

  @Get('categories')
  @Roles('tenant_admin', 'manager')
  listCategories(
    @CurrentUser() user: JwtPayload,
    @Query('storeId') storeId?: string,
    @Query('all') all?: string,
  ) {
    return this.menuService.listCategories(user.tenantId, storeId, all === 'true');
  }

  @Post('categories')
  @Roles('tenant_admin', 'manager')
  createCategory(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(user.tenantId, dto);
  }

  @Patch('categories/:id')
  @Roles('tenant_admin', 'manager')
  updateCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.menuService.updateCategory(user.tenantId, id, dto);
  }

  @Delete('categories/:id')
  @Roles('tenant_admin', 'manager')
  deleteCategory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.deleteCategory(user.tenantId, id);
  }

  @Get('items')
  @Roles('tenant_admin', 'manager')
  listItems(
    @CurrentUser() user: JwtPayload,
    @Query('storeId') storeId?: string,
    @Query('all') all?: string,
  ) {
    return this.menuService.listMenuItems(user.tenantId, storeId, all === 'true');
  }

  @Post('items')
  @Roles('tenant_admin', 'manager')
  createItem(@CurrentUser() user: JwtPayload, @Body() dto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(user.tenantId, dto);
  }

  @Patch('items/:id')
  @Roles('tenant_admin', 'manager')
  updateItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(user.tenantId, id, dto);
  }

  @Delete('items/:id')
  @Roles('tenant_admin', 'manager')
  deleteItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.deleteMenuItem(user.tenantId, id);
  }
}

@Controller('pos/menu')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MenuPosController {
  constructor(private menuService: MenuService) {}

  @Get()
  @Roles('cashier', 'manager', 'tenant_admin')
  list(@CurrentUser() user: JwtPayload, @Query('storeId') storeId?: string, @Query('lang') lang?: string) {
    const sid = storeId ?? user.storeIds[0];
    return this.menuService.getPublicMenu(user.tenantId, sid, lang === 'en' ? 'en' : 'zh');
  }
}
