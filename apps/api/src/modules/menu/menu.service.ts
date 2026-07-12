import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { MenuItem, MenuItemDocument } from '../../schemas/menu-item.schema';
import { normalizeI18n, pickI18n } from '../../schemas/i18n.schema';
import { CreateCategoryDto, CreateMenuItemDto, UpdateCategoryDto, UpdateMenuItemDto } from './menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  private normalizeCategory<T extends Record<string, unknown>>(cat: T) {
    return { ...cat, name: normalizeI18n(cat.name) };
  }

  private normalizeItem<T extends Record<string, unknown>>(item: T) {
    return {
      ...item,
      name: normalizeI18n(item.name),
      description: item.description ? normalizeI18n(item.description) : undefined,
    };
  }

  private withDisplayName<T extends { name: unknown; description?: unknown }>(
    row: T,
    lang: 'zh' | 'en',
  ) {
    return {
      ...row,
      displayName: pickI18n(row.name, lang),
      displayDescription: row.description ? pickI18n(row.description, lang) : undefined,
    };
  }

  async listCategories(tenantId: string, storeId?: string, includeInactive = false) {
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (!includeInactive) filter.isActive = true;
    if (storeId) {
      filter.$or = [{ storeId: new Types.ObjectId(storeId) }, { storeId: null }];
    }
    const rows = await this.categoryModel.find(filter).sort({ sort: 1 }).lean();
    return rows.map((cat) => this.normalizeCategory(cat as Record<string, unknown>));
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
    return this.normalizeCategory(updated.toObject() as unknown as Record<string, unknown>);
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
    return this.normalizeCategory(category.toObject() as unknown as Record<string, unknown>);
  }

  async listMenuItems(tenantId: string, storeId?: string, includeUnavailable = false) {
    const filter: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };
    if (!includeUnavailable) filter.isAvailable = true;
    if (storeId) {
      filter.$or = [{ storeId: new Types.ObjectId(storeId) }, { storeId: null }];
    }
    const rows = await this.menuItemModel.find(filter).sort({ sort: 1 }).lean();
    return rows.map((item) => this.normalizeItem(item as Record<string, unknown>));
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
    return this.normalizeItem(updated.toObject() as unknown as Record<string, unknown>);
  }

  async deleteMenuItem(tenantId: string, id: string) {
    const item = await this.menuItemModel.findOneAndDelete({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return { deleted: true, id: item._id };
  }

  async getPublicMenu(tenantId: string, storeId: string, lang: 'zh' | 'en' = 'zh') {
    const [categories, items] = await Promise.all([
      this.listCategories(tenantId, storeId),
      this.listMenuItems(tenantId, storeId),
    ]);

    return {
      lang,
      categories: categories.map((cat) => this.withDisplayName(cat, lang)),
      items: items.map((item) => this.withDisplayName(item, lang)),
    };
  }
}
