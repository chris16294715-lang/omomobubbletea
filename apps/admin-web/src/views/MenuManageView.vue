<template>
  <AdminLayout subtitle="菜单管理">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="menu-page">
      <section class="panel">
        <div class="panel-head">
          <h2>分类管理</h2>
          <button class="btn primary" @click="openCategoryForm()">+ 添加分类</button>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <div v-if="categories.length === 0" class="empty">暂无分类，请先添加</div>
        <ul v-else class="category-list">
          <li v-for="cat in categories" :key="cat._id" :class="{ inactive: !cat.isActive }">
            <div>
              <strong>{{ formatI18n(cat.name) }}</strong>
              <small>
                中文：{{ cat.name.zh }} · English：{{ cat.name.en }}
                · 排序 {{ cat.sort }} · {{ cat.isActive ? '启用' : '已停用' }}
              </small>
            </div>
            <div class="actions">
              <button class="btn ghost" @click="openCategoryForm(cat)">编辑</button>
              <button v-if="cat.isActive" class="btn danger" @click="removeCategory(cat)">删除</button>
              <button v-else class="btn ghost" @click="restoreCategory(cat)">恢复</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>菜品管理</h2>
          <button class="btn primary" :disabled="activeCategories.length === 0" @click="openItemForm()">
            + 添加菜品
          </button>
        </div>

        <div class="filter">
          <label>
            按分类筛选
            <select v-model="filterCategoryId">
              <option value="">全部分类</option>
              <option v-for="cat in activeCategories" :key="cat._id" :value="cat._id">
                {{ formatI18n(cat.name) }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="filteredItems.length === 0" class="empty">暂无菜品</div>
        <div v-else class="item-groups">
          <div v-for="group in groupedItems" :key="group.categoryId" class="item-group">
            <h3>{{ group.categoryName }}</h3>
            <ul class="item-list">
              <li v-for="item in group.items" :key="item._id" :class="{ inactive: !item.isAvailable }">
                <div>
                  <strong>{{ formatI18n(item.name) }}</strong>
                  <small>
                    ¥{{ formatPrice(item.basePrice) }}
                    <span v-if="item.description"> · {{ formatI18n(item.description) }}</span>
                    · {{ item.isAvailable ? '上架' : '下架' }}
                  </small>
                </div>
                <div class="actions">
                  <button class="btn ghost" @click="openItemForm(item)">编辑</button>
                  <button
                    v-if="!item.isAvailable"
                    class="btn ghost"
                    @click="toggleItemAvailable(item, true)"
                  >
                    上架
                  </button>
                  <button
                    v-else
                    class="btn ghost"
                    @click="toggleItemAvailable(item, false)"
                  >
                    下架
                  </button>
                  <button class="btn danger" @click="removeItem(item)">删除</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <!-- Category modal -->
    <div v-if="categoryForm.open" class="modal-mask" @click.self="categoryForm.open = false">
      <div class="modal">
        <h3>{{ categoryForm.id ? '编辑分类' : '添加分类' }}</h3>
        <form @submit.prevent="saveCategory">
          <label>
            分类名称（中文）
            <input v-model="categoryForm.nameZh" required placeholder="例如：经典奶茶" />
          </label>
          <label>
            Category name (English)
            <input v-model="categoryForm.nameEn" required placeholder="e.g. Classic Milk Tea" />
          </label>
          <label>
            排序（数字越小越靠前）
            <input v-model.number="categoryForm.sort" type="number" min="0" />
          </label>
          <div class="modal-actions">
            <button type="button" class="btn ghost" @click="categoryForm.open = false">取消</button>
            <button type="submit" class="btn primary" :disabled="saving">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Item modal -->
    <div v-if="itemForm.open" class="modal-mask" @click.self="itemForm.open = false">
      <div class="modal">
        <h3>{{ itemForm.id ? '编辑菜品' : '添加菜品' }}</h3>
        <form @submit.prevent="saveItem">
          <label>
            所属分类
            <select v-model="itemForm.categoryId" required>
              <option v-for="cat in activeCategories" :key="cat._id" :value="cat._id">
                {{ formatI18n(cat.name) }}
              </option>
            </select>
          </label>
          <label>
            菜品名称（中文）
            <input v-model="itemForm.nameZh" required placeholder="例如：珍珠奶茶" />
          </label>
          <label>
            Item name (English)
            <input v-model="itemForm.nameEn" required placeholder="e.g. Bubble Milk Tea" />
          </label>
          <label>
            描述（中文，可选）
            <input v-model="itemForm.descriptionZh" placeholder="简短描述" />
          </label>
          <label>
            Description (English, optional)
            <input v-model="itemForm.descriptionEn" placeholder="Short description" />
          </label>
          <label>
            价格（元）
            <input v-model="itemForm.priceYuan" type="number" step="0.01" min="0" required />
          </label>
          <label class="checkbox">
            <input v-model="itemForm.isAvailable" type="checkbox" />
            上架销售
          </label>
          <div class="modal-actions">
            <button type="button" class="btn ghost" @click="itemForm.open = false">取消</button>
            <button type="submit" class="btn primary" :disabled="saving">保存</button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import AdminLayout from '../components/AdminLayout.vue';
import {
  Category,
  MenuItem,
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  formatI18n,
  formatPrice,
  listCategories,
  listMenuItems,
  parsePrice,
  updateCategory,
  updateMenuItem,
} from '../api/menu';

function categoryIdOf(item: MenuItem) {
  return String(item.categoryId);
}

function normalizeI18nField(value: unknown, fallback = ''): { zh: string; en: string } {
  if (value && typeof value === 'object' && 'zh' in value && 'en' in value) {
    const v = value as { zh: string; en: string };
    return { zh: v.zh || fallback, en: v.en || fallback };
  }
  if (typeof value === 'string') return { zh: value, en: value };
  return { zh: fallback, en: fallback };
}

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const categories = ref<Category[]>([]);
const items = ref<MenuItem[]>([]);
const filterCategoryId = ref('');

const categoryForm = reactive({
  open: false,
  id: '',
  nameZh: '',
  nameEn: '',
  sort: 0,
});

const itemForm = reactive({
  open: false,
  id: '',
  categoryId: '',
  nameZh: '',
  nameEn: '',
  descriptionZh: '',
  descriptionEn: '',
  priceYuan: '12.00',
  isAvailable: true,
});

const activeCategories = computed(() => categories.value.filter((c) => c.isActive));

const filteredItems = computed(() => {
  if (!filterCategoryId.value) return items.value;
  return items.value.filter((i) => categoryIdOf(i) === filterCategoryId.value);
});

const groupedItems = computed(() => {
  const map = new Map<string, { categoryId: string; categoryName: string; items: MenuItem[] }>();

  for (const item of filteredItems.value) {
    const cid = categoryIdOf(item);
    const cat = categories.value.find((c) => c._id === cid);
    const categoryName = cat ? formatI18n(cat.name) : '未分类';
    if (!map.has(cid)) {
      map.set(cid, { categoryId: cid, categoryName, items: [] });
    }
    map.get(cid)!.items.push(item);
  }

  return Array.from(map.values());
});

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const [cats, menuItems] = await Promise.all([listCategories(), listMenuItems()]);
    categories.value = cats.map((cat) => ({
      ...cat,
      name: normalizeI18nField(cat.name),
    }));
    items.value = menuItems.map((item) => ({
      ...item,
      categoryId: categoryIdOf(item),
      name: normalizeI18nField(item.name),
      description: item.description ? normalizeI18nField(item.description) : undefined,
    }));
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    loading.value = false;
  }
}

function openCategoryForm(cat?: Category) {
  categoryForm.open = true;
  categoryForm.id = cat?._id ?? '';
  categoryForm.nameZh = cat?.name.zh ?? '';
  categoryForm.nameEn = cat?.name.en ?? '';
  categoryForm.sort = cat?.sort ?? 0;
}

async function saveCategory() {
  saving.value = true;
  error.value = '';
  const name = { zh: categoryForm.nameZh.trim(), en: categoryForm.nameEn.trim() };
  try {
    if (categoryForm.id) {
      await updateCategory(categoryForm.id, { name, sort: categoryForm.sort });
    } else {
      await createCategory(name, categoryForm.sort);
    }
    categoryForm.open = false;
    await loadData();
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败';
  } finally {
    saving.value = false;
  }
}

async function removeCategory(cat: Category) {
  if (!confirm(`确定删除分类「${formatI18n(cat.name)}」？该分类下的菜品也会下架。`)) return;
  error.value = '';
  try {
    await deleteCategory(cat._id);
    await loadData();
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败';
  }
}

async function restoreCategory(cat: Category) {
  error.value = '';
  try {
    await updateCategory(cat._id, { isActive: true });
    await loadData();
  } catch (e) {
    error.value = e instanceof Error ? e.message : '恢复失败';
  }
}

function openItemForm(item?: MenuItem) {
  itemForm.open = true;
  itemForm.id = item?._id ?? '';
  itemForm.categoryId = item ? categoryIdOf(item) : activeCategories.value[0]?._id ?? '';
  itemForm.nameZh = item?.name.zh ?? '';
  itemForm.nameEn = item?.name.en ?? '';
  itemForm.descriptionZh = item?.description?.zh ?? '';
  itemForm.descriptionEn = item?.description?.en ?? '';
  itemForm.priceYuan = item ? formatPrice(item.basePrice) : '12.00';
  itemForm.isAvailable = item?.isAvailable ?? true;
}

async function saveItem() {
  saving.value = true;
  error.value = '';
  try {
    const name = { zh: itemForm.nameZh.trim(), en: itemForm.nameEn.trim() };
    const description =
      itemForm.descriptionZh.trim() || itemForm.descriptionEn.trim()
        ? {
            zh: itemForm.descriptionZh.trim(),
            en: itemForm.descriptionEn.trim(),
          }
        : undefined;
    const payload = {
      categoryId: itemForm.categoryId,
      name,
      description,
      basePrice: parsePrice(itemForm.priceYuan),
      isAvailable: itemForm.isAvailable,
    };
    if (itemForm.id) {
      await updateMenuItem(itemForm.id, payload);
    } else {
      await createMenuItem(payload);
    }
    itemForm.open = false;
    await loadData();
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败';
  } finally {
    saving.value = false;
  }
}

async function removeItem(item: MenuItem) {
  if (!confirm(`确定永久删除菜品「${formatI18n(item.name)}」？删除后不可恢复。`)) return;
  error.value = '';
  try {
    await deleteMenuItem(item._id);
    items.value = items.value.filter((i) => i._id !== item._id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除失败';
  }
}

async function toggleItemAvailable(item: MenuItem, isAvailable: boolean) {
  error.value = '';
  try {
    await updateMenuItem(item._id, { isAvailable });
    item.isAvailable = isAvailable;
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败';
  }
}

onMounted(loadData);
</script>

<style scoped>
.menu-page {
  display: grid;
  gap: 24px;
}

.panel {
  background: white;
  border: 1px solid #eadfce;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(74, 45, 18, 0.06);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.panel-head h2 {
  font-size: 20px;
}

.filter {
  margin-bottom: 16px;
}

.filter label {
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: #6d4520;
}

.filter select,
.modal input,
.modal select {
  border: 1px solid #dcc6ae;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fffdfb;
}

.category-list,
.item-list {
  list-style: none;
  display: grid;
  gap: 10px;
}

.category-list li,
.item-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #f0e4d6;
  border-radius: 12px;
  background: #fffdfb;
}

.category-list li.inactive,
.item-list li.inactive {
  opacity: 0.65;
  background: #faf6f0;
}

.category-list small,
.item-list small {
  display: block;
  color: #8a7b6d;
  margin-top: 4px;
}

.item-group h3 {
  margin: 16px 0 10px;
  color: #6d4520;
  font-size: 16px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border: none;
  font-size: 14px;
}

.btn.primary {
  background: #8b5a2b;
  color: white;
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.ghost {
  background: white;
  border: 1px solid #dcc6ae;
  color: #6d4520;
}

.btn.danger {
  background: #fff5f5;
  border: 1px solid #f0c9c9;
  color: #b42318;
}

.loading,
.empty {
  text-align: center;
  color: #8a7b6d;
  padding: 40px;
}

.error {
  color: #b42318;
  background: #fff5f5;
  border: 1px solid #f0c9c9;
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(47, 36, 25, 0.45);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: min(420px, 100%);
  display: grid;
  gap: 16px;
}

.modal form {
  display: grid;
  gap: 14px;
}

.modal label {
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: #6d4520;
}

.modal .checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}
</style>
