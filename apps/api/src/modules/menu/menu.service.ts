import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { MenuItem, MenuItemDocument } from '../../schemas/menu-item.schema';
import { CreateCategoryDto, CreateMenuItemDto, UpdateCategoryDto, UpdateMenuItemDto } from './menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  listCategories(tenantId: string, storeId?: string, includeInactive = false) {
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (!includeInactive) filter.isActive = true;
    if (storeId) {
      filter.$or = [{ storeId: new Types.ObjectId(storeId) }, { storeId: null }];
    }
    return this.categoryModel.find(filter).sort({ sort: 1 }).lean();
  }

  createCategory(tenantId: string, dto: CreateCategoryDto) {
    return this.categoryModel.create({
      tenantId: new Types.ObjectId(tenantId),
      storeId: dto.storeId ? new Types.ObjectId(dto.storeId) : undefined,
      name: dto.name,
      sort: dto.sort ?? 0,
    });
  }

  async updateCategory(tenantId: string, id: string, dto: UpdateCategoryDto) {
    const updated = await this.categoryModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      dto,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async deleteCategory(tenantId: string, id: string) {
    const category = await this.categoryModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      { isActive: false },
      { new: true },
    );
    if (!category) throw new NotFoundException('Category not found');

    await this.menuItemModel.updateMany(
      { categoryId: category._id, tenantId: new Types.ObjectId(tenantId) },
      { isAvailable: false },
    );
    return category;
  }

  listMenuItems(tenantId: string, storeId?: string, includeUnavailable = false) {
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (!includeUnavailable) filter.isAvailable = true;
    if (storeId) {
      filter.$or = [{ storeId: new Types.ObjectId(storeId) }, { storeId: null }];
    }
    return this.menuItemModel.find(filter).sort({ sort: 1 }).lean();
  }

  createMenuItem(tenantId: string, dto: CreateMenuItemDto) {
    return this.menuItemModel.create({
      tenantId: new Types.ObjectId(tenantId),
      storeId: dto.storeId ? new Types.ObjectId(dto.storeId) : undefined,
      categoryId: new Types.ObjectId(dto.categoryId),
      name: dto.name,
      description: dto.description,
      basePrice: dto.basePrice,
      specs: dto.specs ?? [],
      toppings: dto.toppings ?? [],
      isAvailable: dto.isAvailable ?? true,
    });
  }

  async updateMenuItem(tenantId: string, id: string, dto: UpdateMenuItemDto) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.categoryId) update.categoryId = new Types.ObjectId(dto.categoryId);

    const updated = await this.menuItemModel.findOneAndUpdate(
      { _id: id, tenantId: new Types.ObjectId(tenantId) },
      update,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Menu item not found');
    return updated;
  }

  async deleteMenuItem(tenantId: string, id: string) {
    const item = await this.menuItemModel.findOneAndDelete({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return { deleted: true, id: item._id };
  }

  getPublicMenu(tenantId: string, storeId: string) {
    return Promise.all([
      this.listCategories(tenantId, storeId),
      this.listMenuItems(tenantId, storeId),
    ]).then(([categories, items]) => ({ categories, items }));
  }
}
