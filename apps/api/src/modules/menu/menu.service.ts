import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { MenuItem, MenuItemDocument } from '../../schemas/menu-item.schema';
import { normalizeI18n, pickI18n } from '../../schemas/i18n.schema';
import { CreateCategoryDto, CreateMenuItemDto, UpdateCategoryDto, UpdateMenuItemDto } from './menu.dto';

type ToppingOptionRow = { name: string; price: number; maxQty: number };
type ToppingCatalogRow = {
  name: { zh: string; en: string };
  selectionMode: 'single' | 'multiple';
  options: ToppingOptionRow[];
};

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  private normalizeCategory<T extends Record<string, unknown>>(cat: T) {
    return { ...cat, name: normalizeI18n(cat.name) };
  }

  private normalizeSelectionMode(value: unknown): 'single' | 'multiple' {
    return value === 'single' ? 'single' : 'multiple';
  }

  private resolveToppingCatalogs(item: Record<string, unknown>): ToppingCatalogRow[] {
    const catalogs = item.toppingCatalogs as ToppingCatalogRow[] | undefined;
    if (catalogs?.length) {
      return catalogs.map((cat) => ({
        name: normalizeI18n(cat.name),
        selectionMode: this.normalizeSelectionMode(cat.selectionMode),
        options: (cat.options ?? []).map((opt) => ({
          name: opt.name,
          price: opt.price ?? 0,
          maxQty: opt.maxQty ?? 1,
        })),
      }));
    }

    const legacy = item.toppings as ToppingOptionRow[] | undefined;
    if (legacy?.length) {
      return [
        {
          name: { zh: '加料', en: 'Toppings' },
          selectionMode: 'multiple',
          options: legacy.map((opt) => ({
            name: opt.name,
            price: opt.price ?? 0,
            maxQty: opt.maxQty ?? 1,
          })),
        },
      ];
    }

    return [];
  }

  private normalizeItem<T extends Record<string, unknown>>(item: T) {
    const toppingCatalogs = this.resolveToppingCatalogs(item);
    const { toppings: _legacy, toppingCatalogs: _raw, ...rest } = item;
    return {
      ...rest,
      name: normalizeI18n(item.name),
      description: item.description ? normalizeI18n(item.description) : undefined,
      toppingCatalogs,
    };
  }

  private prepareToppingCatalogsFromDto(
    dto: Pick<CreateMenuItemDto, 'toppingCatalogs' | 'toppings'>,
  ): ToppingCatalogRow[] {
    if (dto.toppingCatalogs?.length) {
      return dto.toppingCatalogs.map((cat) => ({
        name: normalizeI18n(cat.name),
        selectionMode: this.normalizeSelectionMode(cat.selectionMode),
        options: (cat.options ?? [])
          .filter((opt) => opt.name?.trim())
          .map((opt) => ({
            name: opt.name.trim(),
            price: opt.price ?? 0,
            maxQty: Math.max(1, opt.maxQty ?? 1),
          })),
      }));
    }

    if (dto.toppings?.length) {
      return [
        {
          name: { zh: '加料', en: 'Toppings' },
          selectionMode: 'multiple',
          options: dto.toppings
            .filter((opt) => opt.name?.trim())
            .map((opt) => ({
              name: opt.name.trim(),
              price: opt.price ?? 0,
              maxQty: Math.max(1, opt.maxQty ?? 1),
            })),
        },
      ];
    }

    return [];
  }

  private withDisplayName<
    T extends {
      name: unknown;
      description?: unknown;
      toppingCatalogs?: ToppingCatalogRow[];
    },
  >(row: T, lang: 'zh' | 'en') {
    return {
      ...row,
      displayName: pickI18n(row.name, lang),
      displayDescription: row.description ? pickI18n(row.description, lang) : undefined,
      toppingCatalogs: (row.toppingCatalogs ?? []).map((cat) => ({
        name: cat.name,
        displayName: pickI18n(cat.name, lang),
        selectionMode: cat.selectionMode,
        options: (cat.options ?? []).map((opt) => ({
          ...opt,
          displayName: opt.name,
          catalog: pickI18n(cat.name, lang),
        })),
      })),
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
    const toppingCatalogs = this.prepareToppingCatalogsFromDto(dto);
    return this.menuItemModel.create({
      tenantId: new Types.ObjectId(tenantId),
      storeId: dto.storeId ? new Types.ObjectId(dto.storeId) : undefined,
      categoryId: new Types.ObjectId(dto.categoryId),
      name: dto.name,
      description: dto.description,
      basePrice: dto.basePrice,
      specs: dto.specs ?? [],
      toppingCatalogs,
      toppings: [],
      isAvailable: dto.isAvailable ?? true,
    });
  }

  async updateMenuItem(tenantId: string, id: string, dto: UpdateMenuItemDto) {
    const update: Record<string, unknown> = { ...dto };
    if (dto.categoryId) update.categoryId = new Types.ObjectId(dto.categoryId);

    if (dto.toppingCatalogs !== undefined || dto.toppings !== undefined) {
      update.toppingCatalogs = this.prepareToppingCatalogsFromDto(dto);
      update.toppings = [];
    }

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
