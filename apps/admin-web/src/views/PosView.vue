<template>
  <AdminLayout subtitle="收银点单" wide>
    <div v-if="loading" class="loading">加载菜单中...</div>
    <div v-else class="pos">
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <div class="pos-grid">
        <!-- 菜单区 -->
        <section class="menu-panel">
          <div class="panel-head">
            <h2>点单</h2>
            <div class="lang-toggle">
              <button :class="{ active: lang === 'zh' }" @click="switchLang('zh')">中文</button>
              <button :class="{ active: lang === 'en' }" @click="switchLang('en')">EN</button>
            </div>
          </div>

          <div class="category-tabs">
            <button
              v-for="cat in activeCategories"
              :key="cat._id"
              :class="{ active: selectedCategoryId === cat._id }"
              @click="selectedCategoryId = cat._id"
            >
              {{ cat.displayName }}
            </button>
          </div>

          <div class="item-grid">
            <button
              v-for="item in categoryItems"
              :key="item._id"
              class="item-card"
              @click="onItemClick(item)"
            >
              <strong>{{ item.displayName }}</strong>
              <span v-if="item.displayDescription" class="desc">{{ item.displayDescription }}</span>
              <span class="price">{{ formatMoney(item.basePrice) }}<template v-if="itemHasToppings(item)"> 起</template></span>
              <span v-if="itemHasToppings(item)" class="topping-badge">可选加料</span>
            </button>
          </div>
          <p v-if="categoryItems.length === 0" class="empty">该分类暂无菜品</p>
        </section>

        <!-- 购物车 -->
        <section class="cart-panel">
          <h2>当前订单</h2>

          <ul v-if="cart.length" class="cart-list">
            <li v-for="(line, idx) in cart" :key="line.lineId">
              <div class="line-info">
                <div class="line-name">
                  <strong>{{ line.name }}</strong>
                  <small v-if="line.toppingLabel" class="topping-label">{{ line.toppingLabel }}</small>
                </div>
                <span>{{ formatMoney(line.unitPrice) }}</span>
              </div>
              <div class="line-actions">
                <button @click="changeQty(idx, -1)">−</button>
                <span>{{ line.qty }}</span>
                <button @click="changeQty(idx, 1)">+</button>
                <button class="remove" @click="cart.splice(idx, 1)">×</button>
              </div>
            </li>
          </ul>
          <p v-else class="empty">点击左侧菜品加入购物车</p>

          <label class="note">
            备注
            <input v-model="customerNote" placeholder="少冰、少糖..." />
          </label>

          <div class="payment">
            <span>支付方式</span>
            <div class="pay-btns">
              <button
                v-for="m in paymentMethods"
                :key="m.value"
                :class="{ active: paymentMethod === m.value }"
                @click="selectPayment(m.value)"
              >
                {{ m.label }}
              </button>
            </div>
          </div>

          <div v-if="paymentMethod === 'cash'" class="payment-extra">
            <label>
              收取现金（€）
              <input
                v-model="cashReceivedInput"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </label>
            <div v-if="showCashChange" class="change-row">
              <span>找零</span>
              <strong>{{ formatMoney(cashChangeCents) }}</strong>
            </div>
            <p v-else-if="cashReceivedInput && cashPaymentInvalid" class="payment-hint">
              收取金额不足，还差 {{ formatMoney(cartTotal - cashReceivedCents) }}
            </p>
          </div>

          <div v-if="paymentMethod === 'mixed'" class="payment-extra">
            <label>
              现金金额（€）
              <input
                v-model="mixedCashInput"
                type="number"
                step="0.01"
                min="0"
                :max="formatPrice(cartTotal)"
                placeholder="0.00"
              />
            </label>
            <label>
              刷卡金额（€）
              <input
                :value="cardAmountDisplay"
                type="number"
                step="0.01"
                readonly
                tabindex="-1"
              />
            </label>
            <p v-if="mixedInvalid" class="payment-hint">现金与刷卡金额之和须等于合计</p>
          </div>

          <div class="total-row">
            <span>合计</span>
            <strong>{{ formatMoney(cartTotal) }}</strong>
          </div>

          <button
            class="submit-btn"
            :disabled="
              !cart.length ||
              submitting ||
              (paymentMethod === 'cash' && cashPaymentInvalid) ||
              (paymentMethod === 'mixed' && mixedInvalid)
            "
            @click="submitOrder"
          >
            {{ submitting ? '提交中...' : '确认收款' }}
          </button>
        </section>
      </div>

      <!-- 今日订单 -->
      <section class="today-panel">
        <div class="panel-head">
          <h2>今日订单（{{ todayOrders.length }}）</h2>
          <button class="btn ghost" @click="loadTodayOrders">刷新</button>
        </div>
        <ul v-if="todayOrders.length" class="today-list">
          <li v-for="order in todayOrders" :key="order._id">
            <div>
              <strong>#{{ order.orderNo }}</strong>
              <span v-if="order.pickupNo" class="pickup">取餐号 {{ order.pickupNo }}</span>
              <small>{{ formatTime(order.createdAt) }} · {{ formatMoney(order.total) }} · {{ payLabel(order) }}</small>
            </div>
            <span class="status">{{ statusLabel(order.status) }}</span>
          </li>
        </ul>
        <p v-else class="empty">今日暂无订单</p>
      </section>
    </div>

    <!-- 加料选择 -->
    <div v-if="toppingPickerOpen && pickingItem" class="modal-backdrop" @click.self="closeToppingPicker">
      <div class="topping-modal">
        <div class="modal-head">
          <h3>{{ pickingItem.displayName }}</h3>
          <button type="button" class="modal-close" @click="closeToppingPicker">×</button>
        </div>
        <p class="base-price">基础价 {{ formatMoney(pickingItem.basePrice) }}</p>
        <div class="picker-body">
          <section v-for="cat in pickingItem.toppingCatalogs" :key="cat.displayName" class="catalog-row">
            <h4 class="catalog-title">{{ cat.displayName }}</h4>
            <div class="catalog-options">
              <template v-if="cat.selectionMode === 'single'">
                <button
                  v-for="top in cat.options"
                  :key="toppingKey(cat.displayName, top.name)"
                  type="button"
                  class="option-chip single"
                  :class="{ active: isSingleSelected(cat, top) }"
                  @click="selectSingleOption(cat, top)"
                >
                  <div class="option-meta">
                    <strong>{{ top.displayName }}</strong>
                    <span v-if="top.price > 0" class="top-price">+{{ formatMoney(top.price) }}</span>
                  </div>
                </button>
              </template>
              <template v-else>
                <div
                  v-for="top in cat.options"
                  :key="toppingKey(cat.displayName, top.name)"
                  class="option-chip"
                >
                  <div class="option-meta">
                    <strong>{{ top.displayName }}</strong>
                    <span v-if="top.price > 0" class="top-price">+{{ formatMoney(top.price) }}</span>
                  </div>
                  <div class="top-qty">
                    <button
                      type="button"
                      :disabled="(toppingQtys[toppingKey(cat.displayName, top.name)] ?? 0) <= 0"
                      @click="changeToppingQty(toppingKey(cat.displayName, top.name), -1, top.maxQty)"
                    >
                      −
                    </button>
                    <span>{{ toppingQtys[toppingKey(cat.displayName, top.name)] ?? 0 }}</span>
                    <button
                      type="button"
                      :disabled="(toppingQtys[toppingKey(cat.displayName, top.name)] ?? 0) >= top.maxQty"
                      @click="changeToppingQty(toppingKey(cat.displayName, top.name), 1, top.maxQty)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </section>
        </div>
        <div class="picker-total">
          <span>单价</span>
          <strong>{{ formatMoney(pickingUnitPrice) }}</strong>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn ghost" @click="closeToppingPicker">取消</button>
          <button type="button" class="btn primary" @click="confirmToppingPicker">加入购物车</button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AdminLayout from '../components/AdminLayout.vue';
import { getSession } from '../api/auth';
import {
  PaymentMethod,
  PosMenuItem,
  PosMenuToppingCatalog,
  PosMenuToppingOption,
  createPosOrder,
  fetchPosMenu,
  formatMoney,
  formatPrice,
  listTodayOrders,
  PosOrder,
} from '../api/pos';

interface SelectedTopping {
  catalog: string;
  name: string;
  qty: number;
}

interface CartLine {
  lineId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  qty: number;
  toppings: SelectedTopping[];
  toppingLabel?: string;
}

const session = getSession();
const storeId = session?.user.storeIds[0] ?? '';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const success = ref('');
const lang = ref<'zh' | 'en'>('zh');

const categories = ref<{ _id: string; displayName: string; isActive: boolean; sort: number }[]>([]);
const items = ref<PosMenuItem[]>([]);
const selectedCategoryId = ref('');
const cart = ref<CartLine[]>([]);
const customerNote = ref('');
const paymentMethod = ref<PaymentMethod>('cash');
const cashReceivedInput = ref('');
const mixedCashInput = ref('');
const todayOrders = ref<PosOrder[]>([]);
const toppingPickerOpen = ref(false);
const pickingItem = ref<PosMenuItem | null>(null);
const toppingQtys = ref<Record<string, number>>({});

const paymentMethods = [
  { value: 'cash' as PaymentMethod, label: '现金' },
  { value: 'card' as PaymentMethod, label: '刷卡' },
  { value: 'mixed' as PaymentMethod, label: '混合支付' },
];

const activeCategories = computed(() =>
  categories.value.filter((c) => c.isActive).sort((a, b) => a.sort - b.sort),
);

const categoryItems = computed(() => {
  if (!selectedCategoryId.value) return [];
  return items.value.filter(
    (i) => String(i.categoryId) === selectedCategoryId.value && i.isAvailable,
  );
});

const cartTotal = computed(() =>
  cart.value.reduce((sum, line) => sum + line.unitPrice * line.qty, 0),
);

const cashReceivedCents = computed(() => parseEuroInput(cashReceivedInput.value));

const mixedCashCents = computed(() => parseEuroInput(mixedCashInput.value));

const cashChangeCents = computed(() => {
  if (paymentMethod.value !== 'cash') return 0;
  return Math.max(0, cashReceivedCents.value - cartTotal.value);
});

const showCashChange = computed(
  () =>
    paymentMethod.value === 'cash' &&
    cartTotal.value > 0 &&
    cashReceivedCents.value >= cartTotal.value,
);

const cashPaymentInvalid = computed(() => {
  if (paymentMethod.value !== 'cash' || !cart.value.length) return false;
  return cashReceivedCents.value < cartTotal.value;
});

const cardAmountCents = computed(() => {
  if (paymentMethod.value !== 'mixed') return 0;
  return Math.max(0, cartTotal.value - mixedCashCents.value);
});

const cardAmountDisplay = computed(() =>
  paymentMethod.value === 'mixed' ? (cardAmountCents.value / 100).toFixed(2) : '',
);

const mixedInvalid = computed(() => {
  if (paymentMethod.value !== 'mixed' || !cart.value.length) return false;
  const cash = mixedCashCents.value;
  return cash <= 0 || cash >= cartTotal.value || cash + cardAmountCents.value !== cartTotal.value;
});

function parseEuroInput(value: string) {
  const n = parseFloat(value);
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function selectPayment(method: PaymentMethod) {
  paymentMethod.value = method;
  cashReceivedInput.value = '';
  mixedCashInput.value = '';
}

function payLabel(order: PosOrder) {
  const method = order.paymentMethod;
  if (method === 'mixed' && order.paymentCash != null && order.paymentCard != null) {
    return `混合（现金 ${formatMoney(order.paymentCash)} + 刷卡 ${formatMoney(order.paymentCard)}）`;
  }
  const map: Record<string, string> = {
    cash: '现金',
    card: '刷卡',
    mixed: '混合支付',
  };
  return method ? map[method] ?? method : '-';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    paid: '已支付',
    preparing: '制作中',
    ready: '待取餐',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] ?? status;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

async function loadMenu() {
  loading.value = true;
  error.value = '';
  try {
    const menu = await fetchPosMenu(lang.value);
    categories.value = menu.categories.map((c) => ({
      _id: c._id,
      displayName: c.displayName,
      isActive: c.isActive,
      sort: c.sort,
    }));
    items.value = menu.items.map((i) => ({ ...i, categoryId: String(i.categoryId) }));
    if (!selectedCategoryId.value && activeCategories.value.length) {
      selectedCategoryId.value = activeCategories.value[0]._id;
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载菜单失败';
  } finally {
    loading.value = false;
  }
}

async function switchLang(next: 'zh' | 'en') {
  lang.value = next;
  await loadMenu();
}

function toppingKey(catalog: string, name: string) {
  return `${catalog}::${name}`;
}

function flattenOptions(item: PosMenuItem) {
  const result: {
    catalog: string;
    name: string;
    displayName: string;
    price: number;
    maxQty: number;
  }[] = [];
  for (const cat of item.toppingCatalogs ?? []) {
    for (const opt of cat.options ?? []) {
      result.push({
        catalog: cat.displayName,
        name: opt.name,
        displayName: opt.displayName,
        price: opt.price,
        maxQty: opt.maxQty,
      });
    }
  }
  return result;
}

function itemHasToppings(item: PosMenuItem) {
  return flattenOptions(item).length > 0;
}

function buildLineId(menuItemId: string, toppings: SelectedTopping[]) {
  const parts = toppings
    .filter((t) => t.qty > 0)
    .sort((a, b) => `${a.catalog}:${a.name}`.localeCompare(`${b.catalog}:${b.name}`))
    .map((t) => `${t.catalog}:${t.name}:${t.qty}`);
  return parts.length ? `${menuItemId}__${parts.join('|')}` : `${menuItemId}__plain`;
}

function buildToppingLabel(item: PosMenuItem, toppings: SelectedTopping[]) {
  const options = flattenOptions(item);
  return toppings
    .filter((t) => t.qty > 0)
    .map((t) => {
      const def = options.find((x) => x.catalog === t.catalog && x.name === t.name);
      const label = def?.displayName ?? t.name;
      return t.qty > 1 ? `${label}×${t.qty}` : label;
    })
    .join('、');
}

function calcUnitPrice(item: PosMenuItem, toppings: SelectedTopping[]) {
  let price = item.basePrice;
  const options = flattenOptions(item);
  for (const t of toppings) {
    if (t.qty <= 0) continue;
    const def = options.find((x) => x.catalog === t.catalog && x.name === t.name);
    if (def) price += def.price * t.qty;
  }
  return price;
}

function selectedToppingsFromQtys(): SelectedTopping[] {
  return Object.entries(toppingQtys.value)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const sep = key.indexOf('::');
      const catalog = key.slice(0, sep);
      const name = key.slice(sep + 2);
      return { catalog, name, qty };
    });
}

const pickingUnitPrice = computed(() => {
  if (!pickingItem.value) return 0;
  return calcUnitPrice(pickingItem.value, selectedToppingsFromQtys());
});

function onItemClick(item: PosMenuItem) {
  if (itemHasToppings(item)) {
    openToppingPicker(item);
  } else {
    addToCart(item, []);
  }
}

function openToppingPicker(item: PosMenuItem) {
  pickingItem.value = item;
  toppingQtys.value = {};
  for (const opt of flattenOptions(item)) {
    toppingQtys.value[toppingKey(opt.catalog, opt.name)] = 0;
  }
  toppingPickerOpen.value = true;
}

function closeToppingPicker() {
  toppingPickerOpen.value = false;
  pickingItem.value = null;
  toppingQtys.value = {};
}

function changeToppingQty(key: string, delta: number, maxQty: number) {
  const current = toppingQtys.value[key] ?? 0;
  toppingQtys.value[key] = Math.min(maxQty, Math.max(0, current + delta));
}

function isSingleSelected(cat: PosMenuToppingCatalog, top: PosMenuToppingOption) {
  return (toppingQtys.value[toppingKey(cat.displayName, top.name)] ?? 0) > 0;
}

function selectSingleOption(cat: PosMenuToppingCatalog, top: PosMenuToppingOption) {
  const key = toppingKey(cat.displayName, top.name);
  const wasSelected = (toppingQtys.value[key] ?? 0) > 0;
  for (const opt of cat.options) {
    toppingQtys.value[toppingKey(cat.displayName, opt.name)] = 0;
  }
  if (!wasSelected) {
    toppingQtys.value[key] = 1;
  }
}

function confirmToppingPicker() {
  if (!pickingItem.value) return;
  addToCart(pickingItem.value, selectedToppingsFromQtys());
  closeToppingPicker();
}

function addToCart(item: PosMenuItem, toppings: SelectedTopping[]) {
  const activeToppings = toppings.filter((t) => t.qty > 0);
  const lineId = buildLineId(item._id, activeToppings);
  const existing = cart.value.find((l) => l.lineId === lineId);
  if (existing) {
    existing.qty += 1;
  } else {
    const toppingLabel = buildToppingLabel(item, activeToppings);
    cart.value.push({
      lineId,
      menuItemId: item._id,
      name: item.displayName,
      unitPrice: calcUnitPrice(item, activeToppings),
      qty: 1,
      toppings: activeToppings,
      toppingLabel: toppingLabel || undefined,
    });
  }
}

function changeQty(index: number, delta: number) {
  const line = cart.value[index];
  line.qty += delta;
  if (line.qty <= 0) cart.value.splice(index, 1);
}

async function submitOrder() {
  if (!storeId) {
    error.value = '未绑定门店，请联系管理员';
    return;
  }
  if (paymentMethod.value === 'cash' && cashPaymentInvalid.value) {
    error.value = '收取现金金额须不少于订单合计';
    return;
  }
  if (paymentMethod.value === 'mixed' && mixedInvalid.value) {
    error.value = '请填写有效的混合支付金额（现金与刷卡均须大于 0，且合计等于订单总额）';
    return;
  }
  submitting.value = true;
  error.value = '';
  success.value = '';
  try {
    const payload: Parameters<typeof createPosOrder>[0] = {
      storeId,
      items: cart.value.map((l) => ({
        menuItemId: l.menuItemId,
        name: l.name,
        unitPrice: l.unitPrice,
        qty: l.qty,
        toppings: l.toppings.length
          ? l.toppings.map((t) => ({ catalog: t.catalog, name: t.name, qty: t.qty }))
          : undefined,
      })),
      paymentMethod: paymentMethod.value,
      customerNote: customerNote.value.trim() || undefined,
    };
    if (paymentMethod.value === 'mixed') {
      payload.cashAmount = mixedCashCents.value;
      payload.cardAmount = cardAmountCents.value;
    }
    const changeDue = paymentMethod.value === 'cash' ? cashChangeCents.value : 0;
    const order = await createPosOrder(payload);
    success.value = `下单成功！取餐号 ${order.pickupNo ?? order.orderNo}，金额 ${formatMoney(order.total)}`;
    if (changeDue > 0) {
      success.value += `，找零 ${formatMoney(changeDue)}`;
    }
    cart.value = [];
    customerNote.value = '';
    cashReceivedInput.value = '';
    mixedCashInput.value = '';
    paymentMethod.value = 'cash';
    await loadTodayOrders();
  } catch (e) {
    error.value = e instanceof Error ? e.message : '下单失败';
  } finally {
    submitting.value = false;
  }
}

async function loadTodayOrders() {
  try {
    todayOrders.value = await listTodayOrders(storeId || undefined);
  } catch {
    /* ignore */
  }
}

onMounted(async () => {
  await loadMenu();
  await loadTodayOrders();
});
</script>

<style scoped>
.pos {
  display: grid;
  gap: 20px;
}

.pos-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}

.menu-panel,
.cart-panel,
.today-panel {
  background: white;
  border: 1px solid #eadfce;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(74, 45, 18, 0.06);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-head h2 {
  font-size: 18px;
}

.lang-toggle {
  display: flex;
  gap: 4px;
}

.lang-toggle button {
  border: 1px solid #dcc6ae;
  background: white;
  border-radius: 8px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 13px;
}

.lang-toggle button.active {
  background: #8b5a2b;
  color: white;
  border-color: #8b5a2b;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.category-tabs button {
  border: 1px solid #dcc6ae;
  background: #fffdfb;
  border-radius: 20px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 14px;
}

.category-tabs button.active {
  background: #f3e4d4;
  border-color: #8b5a2b;
  font-weight: 600;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.item-card {
  border: 1px solid #f0e4d6;
  border-radius: 12px;
  padding: 12px;
  background: #fffdfb;
  cursor: pointer;
  text-align: left;
  display: grid;
  gap: 4px;
  transition: border-color 0.15s, transform 0.15s;
}

.item-card:hover {
  border-color: #c9956b;
  transform: translateY(-1px);
}

.item-card .desc {
  font-size: 12px;
  color: #8a7b6d;
}

.item-card .price {
  color: #8b5a2b;
  font-weight: 600;
}

.topping-badge {
  font-size: 11px;
  color: #6d4520;
  background: #f3e4d4;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.cart-panel h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.cart-list {
  list-style: none;
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  max-height: 280px;
  overflow-y: auto;
}

.cart-list li {
  border: 1px solid #f0e4d6;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.line-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
}

.line-name {
  display: grid;
  gap: 2px;
}

.topping-label {
  display: block;
  font-size: 12px;
  color: #8a7b6d;
}

.line-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.line-actions button {
  width: 28px;
  height: 28px;
  border: 1px solid #dcc6ae;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.line-actions .remove {
  margin-left: auto;
  color: #b42318;
}

.note {
  display: grid;
  gap: 6px;
  font-size: 14px;
  margin-bottom: 14px;
}

.note input {
  border: 1px solid #dcc6ae;
  border-radius: 8px;
  padding: 8px 10px;
}

.payment {
  margin-bottom: 14px;
}

.payment > span {
  font-size: 14px;
  color: #6d4520;
}

.pay-btns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.pay-btns button {
  border: 1px solid #dcc6ae;
  border-radius: 8px;
  padding: 8px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

.pay-btns button.active {
  background: #8b5a2b;
  color: white;
  border-color: #8b5a2b;
}

.payment-extra {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px;
  background: #fffdfb;
  border: 1px solid #f0e4d6;
  border-radius: 10px;
}

.payment-extra label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.payment-extra input {
  border: 1px solid #dcc6ae;
  border-radius: 8px;
  padding: 8px 10px;
}

.payment-extra input[readonly] {
  background: #f7f3ee;
  color: #6d4520;
}

.change-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #ecfdf3;
  border: 1px solid #abefc6;
  border-radius: 8px;
}

.change-row strong {
  font-size: 20px;
  color: #027a48;
}

.payment-hint {
  font-size: 13px;
  color: #b42318;
  margin: 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #f0e4d6;
  margin-bottom: 12px;
}

.total-row strong {
  font-size: 22px;
  color: #8b5a2b;
}

.submit-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 14px;
  background: linear-gradient(135deg, #8b5a2b, #6d4520);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.today-list {
  list-style: none;
  display: grid;
  gap: 8px;
}

.today-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #f0e4d6;
  border-radius: 10px;
  background: #fffdfb;
}

.today-list small {
  display: block;
  color: #8a7b6d;
  margin-top: 4px;
}

.pickup {
  margin-left: 8px;
  background: #f3e4d4;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.status {
  font-size: 13px;
  color: #6d4520;
  white-space: nowrap;
}

.loading,
.empty {
  text-align: center;
  color: #8a7b6d;
  padding: 24px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.topping-modal {
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  width: min(780px, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.picker-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-bottom: 12px;
  display: grid;
  gap: 10px;
}

.catalog-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid #f0e4d6;
  border-radius: 12px;
  background: #fffdfb;
  min-width: 0;
}

.catalog-title {
  flex: 0 0 72px;
  font-size: 13px;
  font-weight: 600;
  color: #6d4520;
  margin: 0;
  line-height: 1.3;
}

.catalog-options {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
}

.option-chip {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #eadfce;
  border-radius: 10px;
  background: white;
  white-space: nowrap;
}

.option-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.option-meta strong {
  font-size: 14px;
  font-weight: 600;
  color: #4a2d12;
}

.option-chip.single {
  cursor: pointer;
  border-color: #dcc6ae;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.option-chip.single:hover {
  border-color: #c9956b;
}

.option-chip.single.active {
  border-color: #8b5a2b;
  background: #f3e4d4;
  font-weight: 600;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.modal-head h3 {
  font-size: 18px;
  margin: 0;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #8a7b6d;
}

.base-price {
  font-size: 14px;
  color: #8a7b6d;
  margin: 0 0 14px;
}

.top-price {
  font-size: 12px;
  color: #8b5a2b;
  font-weight: 600;
}

.top-qty {
  display: flex;
  align-items: center;
  gap: 6px;
}

.top-qty button {
  width: 26px;
  height: 26px;
  border: 1px solid #dcc6ae;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.top-qty span {
  min-width: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.top-qty button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .catalog-row {
    flex-direction: column;
    align-items: stretch;
  }

  .catalog-title {
    flex: none;
  }

  .catalog-options {
    flex-wrap: wrap;
  }
}

.picker-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #f0e4d6;
  margin-bottom: 12px;
}

.picker-total strong {
  font-size: 20px;
  color: #8b5a2b;
}

.topping-modal .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.topping-modal .btn {
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
}

.topping-modal .btn.ghost {
  border: 1px solid #dcc6ae;
  background: white;
}

.topping-modal .btn.primary {
  border: none;
  background: #8b5a2b;
  color: white;
}

.error {
  color: #b42318;
  background: #fff5f5;
  border: 1px solid #f0c9c9;
  padding: 10px 12px;
  border-radius: 10px;
}

.success {
  color: #027a48;
  background: #ecfdf3;
  border: 1px solid #abefc6;
  padding: 10px 12px;
  border-radius: 10px;
}

.btn.ghost {
  border: 1px solid #dcc6ae;
  background: white;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .pos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
