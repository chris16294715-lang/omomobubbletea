<template>
  <AdminLayout>
    <div class="reports">
      <header class="page-header">
        <div>
          <p class="eyebrow">Analytics</p>
          <h1>销售报表</h1>
          <p class="subtitle">按日期范围查看门店销售表现与支付方式分布</p>
        </div>
        <div v-if="report" class="period-badge">
          {{ report.startDate }} — {{ report.endDate }}
        </div>
      </header>

      <section class="card toolbar">
        <form class="toolbar-form" @submit.prevent="loadReport">
          <div class="field-group">
            <label class="field">
              <span>开始日期</span>
              <input v-model="startDate" type="date" required @change="activePreset = ''" />
            </label>
            <span class="range-sep">→</span>
            <label class="field">
              <span>结束日期</span>
              <input v-model="endDate" type="date" required @change="activePreset = ''" />
            </label>
          </div>

          <div class="presets">
            <button
              v-for="p in presets"
              :key="p.key"
              type="button"
              class="preset-btn"
              :class="{ active: activePreset === p.key }"
              @click="applyPreset(p.key)"
            >
              {{ p.label }}
            </button>
          </div>

          <button type="submit" class="run-btn" :disabled="loading">
            <span v-if="loading" class="spinner" />
            {{ loading ? '查询中' : '查询报表' }}
          </button>
        </form>

        <div v-if="error" class="alert error">{{ error }}</div>
      </section>

      <div v-if="loading && !report" class="skeleton-grid">
        <div v-for="i in 3" :key="i" class="card skeleton kpi-skeleton" />
        <div class="card skeleton chart-skeleton" />
        <div class="card skeleton chart-skeleton" />
      </div>

      <template v-else-if="report">
        <section class="kpi-grid">
          <button
            v-for="kpi in kpiCards"
            :key="kpi.key"
            type="button"
            class="card kpi-card"
            :class="[kpi.key, { active: selectedKpi === kpi.key }]"
            @click="openKpiModal(kpi.key)"
          >
            <div class="kpi-icon" :style="{ background: kpi.bg, color: kpi.color }">
              {{ kpi.icon }}
            </div>
            <div class="kpi-body">
              <span class="kpi-label">{{ kpi.label }}</span>
              <strong class="kpi-value">{{ kpi.value }}</strong>
              <span class="kpi-hint">点击查看详情</span>
            </div>
          </button>
        </section>

        <section class="payment-section">
          <div class="section-head">
            <div>
              <h2>支付方式</h2>
              <p>各渠道收取金额，点击查看对应订单</p>
            </div>
          </div>

          <div class="payment-grid">
            <button
              v-for="row in paymentCards"
              :key="row.key"
              type="button"
              class="card payment-card"
              :class="{ active: selectedPayment === row.key, empty: row.amount === 0 }"
              @click="openPaymentModal(row.key)"
            >
              <div class="payment-card-top">
                <span class="payment-icon" :style="{ background: row.bg, color: row.color }">{{ row.icon }}</span>
                <span class="payment-percent">{{ row.percent }}%</span>
              </div>
              <span class="payment-label">{{ row.label }}</span>
              <strong class="payment-amount">{{ formatMoney(row.amount) }}</strong>
              <span class="payment-orders">{{ row.orderCount }} 笔订单</span>
              <span class="kpi-hint">点击查看详情</span>
            </button>
          </div>
        </section>

        <section class="detail-grid">
          <article class="card detail-card source-only">
            <div class="card-header">
              <div>
                <h2>订单来源</h2>
                <p>收银台与扫码点餐对比</p>
              </div>
            </div>

            <div class="source-cards">
              <div v-for="src in sourceRows" :key="src.key" class="source-item">
                <div class="source-top">
                  <span class="source-icon" :style="{ background: src.bg }">{{ src.icon }}</span>
                  <span class="source-label">{{ src.label }}</span>
                  <span class="source-percent">{{ src.percent }}%</span>
                </div>
                <strong class="source-amount">{{ formatMoney(src.amount) }}</strong>
                <div class="source-bar">
                  <div class="source-fill" :style="{ width: `${src.percent}%`, background: src.color }" />
                </div>
              </div>
            </div>
          </article>
        </section>
      </template>
    </div>

    <Teleport to="body">
      <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div>
              <h2>{{ modalTitle }}</h2>
              <p>{{ modalSubtitle }}</p>
            </div>
            <button type="button" class="modal-close" aria-label="关闭" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <!-- KPI: 订单 -->
            <template v-if="selectedKpi === 'orders'">
              <div v-if="!hasDetailData" class="empty-state">
                <p>详情数据未加载，请重启 API 服务后重新查询</p>
              </div>
              <div v-else-if="!orderDetails.length" class="empty-state">
                <div class="empty-icon">📭</div>
                <p>该时段暂无订单</p>
              </div>
              <div v-else class="table-wrap flush">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>订单号</th>
                      <th>时间</th>
                      <th>来源</th>
                      <th>支付</th>
                      <th>商品</th>
                      <th class="align-right">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="order in orderDetails" :key="order._id">
                      <tr class="clickable" @click="toggleOrderExpand(order._id)">
                        <td>
                          <strong>#{{ order.orderNo }}</strong>
                          <span v-if="order.pickupNo" class="tag">{{ order.pickupNo }}</span>
                        </td>
                        <td>{{ formatDateTime(order.createdAt) }}</td>
                        <td>{{ formatSource(order.source) }}</td>
                        <td>{{ formatPaymentLabel(order) }}</td>
                        <td>{{ order.itemCount }} 件</td>
                        <td class="align-right amount-cell">{{ formatMoney(order.total) }}</td>
                      </tr>
                      <tr v-if="expandedOrderId === order._id" class="expand-row">
                        <td colspan="6">
                          <ul class="item-lines">
                            <li v-for="(item, idx) in order.items" :key="idx">
                              <span>{{ item.name }} × {{ item.qty }}</span>
                              <span>{{ formatMoney(item.subtotal) }}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- KPI: 销售额 -->
            <template v-else-if="selectedKpi === 'revenue'">
              <div v-if="!dailyTrend.length" class="empty-state"><p>暂无数据</p></div>
              <div v-else class="table-wrap flush">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>订单数</th>
                      <th>占比</th>
                      <th class="align-right">销售额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in dailyTrend" :key="row.date">
                      <td><strong>{{ row.date }}</strong></td>
                      <td>{{ row.orderCount }}</td>
                      <td>
                        <div class="percent-cell">
                          <div class="mini-bar">
                            <div
                              class="mini-fill"
                              :style="{ width: `${dailyRevenuePercent(row.revenue)}%`, background: '#059669' }"
                            />
                          </div>
                          <span>{{ dailyRevenuePercent(row.revenue) }}%</span>
                        </div>
                      </td>
                      <td class="align-right amount-cell">{{ formatMoney(row.revenue) }}</td>
                    </tr>
                  </tbody>
                  <tfoot v-if="report">
                    <tr>
                      <td>合计</td>
                      <td>{{ report.orderCount }}</td>
                      <td />
                      <td class="align-right total-cell">{{ formatMoney(report.revenue) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </template>

            <!-- KPI: 客单价 -->
            <template v-else-if="selectedKpi === 'aov' && aovDetail">
              <div class="aov-stats">
                <div class="aov-stat">
                  <span>平均客单价</span>
                  <strong>{{ formatMoney(aovDetail.averageOrderValue) }}</strong>
                </div>
                <div class="aov-stat">
                  <span>最高单笔</span>
                  <strong>{{ formatMoney(aovDetail.max) }}</strong>
                </div>
                <div class="aov-stat">
                  <span>最低单笔</span>
                  <strong>{{ formatMoney(aovDetail.min) }}</strong>
                </div>
                <div class="aov-stat">
                  <span>中位数</span>
                  <strong>{{ formatMoney(aovDetail.median) }}</strong>
                </div>
              </div>
              <div v-if="!aovDetail.orders.length" class="empty-state"><p>该时段暂无订单</p></div>
              <div v-else class="table-wrap flush">
                <p class="table-caption">按金额从高到低</p>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>订单号</th>
                      <th>时间</th>
                      <th>支付</th>
                      <th class="align-right">金额</th>
                      <th>对比均价</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in aovDetail.orders" :key="order._id">
                      <td>
                        <strong>#{{ order.orderNo }}</strong>
                        <span v-if="order.pickupNo" class="tag">{{ order.pickupNo }}</span>
                      </td>
                      <td>{{ formatDateTime(order.createdAt) }}</td>
                      <td>{{ formatPaymentLabel(order) }}</td>
                      <td class="align-right amount-cell">{{ formatMoney(order.total) }}</td>
                      <td>
                        <span
                          class="diff-badge"
                          :class="orderDiffClass(order.total, aovDetail.averageOrderValue)"
                        >
                          {{ orderDiffLabel(order.total, aovDetail.averageOrderValue) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- 支付方式 -->
            <template v-else-if="selectedPayment">
              <div v-if="!report?.orders" class="empty-state">
                <p>详情数据未加载，请重启 API 服务后重新查询</p>
              </div>
              <div v-else-if="!paymentDetailOrders.length" class="empty-state">
                <div class="empty-icon">📭</div>
                <p>该支付方式暂无订单</p>
              </div>
              <template v-else>
                <div class="payment-detail-summary modal-summary">
                  <span>共 {{ paymentDetailOrders.length }} 笔</span>
                  <strong>{{ formatMoney(paymentDetailTotal) }}</strong>
                </div>
                <div class="table-wrap flush">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>订单号</th>
                        <th>时间</th>
                        <th>来源</th>
                        <th>支付说明</th>
                        <th class="align-right">该方式金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="order in paymentDetailOrders" :key="order._id">
                        <tr class="clickable" @click="toggleOrderExpand(order._id)">
                          <td>
                            <strong>#{{ order.orderNo }}</strong>
                            <span v-if="order.pickupNo" class="tag">{{ order.pickupNo }}</span>
                          </td>
                          <td>{{ formatDateTime(order.createdAt) }}</td>
                          <td>{{ formatSource(order.source) }}</td>
                          <td>{{ formatPaymentLabel(order) }}</td>
                          <td class="align-right amount-cell">
                            {{ formatMoney(orderPaymentAmount(order, selectedPayment)) }}
                          </td>
                        </tr>
                        <tr v-if="expandedOrderId === order._id" class="expand-row">
                          <td colspan="5">
                            <ul class="item-lines">
                              <li v-for="(item, idx) in order.items" :key="idx">
                                <span>{{ item.name }} × {{ item.qty }}</span>
                                <span>{{ formatMoney(item.subtotal) }}</span>
                              </li>
                            </ul>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AdminLayout from '../components/AdminLayout.vue';
import { getSession } from '../api/auth';
import {
  KpiKey,
  PAYMENT_CARD_ORDER,
  PAYMENT_LABELS,
  PaymentKey,
  SalesReport,
  fetchSalesReport,
  formatDateTime,
  formatPaymentLabel,
  formatSource,
  orderMatchesPayment,
  orderPaymentAmount,
} from '../api/reports';
import { formatMoney } from '../utils/currency';

const PAYMENT_ICONS: Record<PaymentKey, string> = {
  cash: '💵',
  card: '💳',
};

const PAYMENT_BGS: Record<PaymentKey, string> = {
  cash: '#ecfdf5',
  card: '#eef2ff',
};

const PAYMENT_COLORS: Record<PaymentKey, string> = {
  cash: '#059669',
  card: '#4f46e5',
};

const session = getSession();
const storeId = session?.user.storeIds[0];

const loading = ref(false);
const error = ref('');
const report = ref<SalesReport | null>(null);
const startDate = ref('');
const endDate = ref('');
const activePreset = ref<'today' | 'week' | 'month' | ''>('week');
const selectedKpi = ref<KpiKey | null>(null);
const selectedPayment = ref<PaymentKey | null>(null);
const expandedOrderId = ref<string | null>(null);

const presets = [
  { key: 'today' as const, label: '今天' },
  { key: 'week' as const, label: '近 7 天' },
  { key: 'month' as const, label: '本月' },
];

function toDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function setRange(preset: 'today' | 'week' | 'month') {
  const end = new Date();
  const start = new Date();
  if (preset === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (preset === 'month') {
    start.setDate(1);
  }
  startDate.value = toDateInput(start);
  endDate.value = toDateInput(end);
  activePreset.value = preset;
}

function applyPreset(preset: 'today' | 'week' | 'month') {
  setRange(preset);
  void loadReport();
}

const paymentCards = computed(() => {
  if (!report.value) return [];
  const total = report.value.revenue || 1;
  const orders = report.value.orders ?? [];

  return PAYMENT_CARD_ORDER.map((key) => {
    const amount = report.value!.byPayment[key] ?? 0;
    const matched = orders.filter((o) => orderMatchesPayment(o, key));
    return {
      key,
      label: PAYMENT_LABELS[key] ?? key,
      icon: PAYMENT_ICONS[key],
      amount,
      percent: Math.round((amount / total) * 100),
      orderCount: matched.length,
      color: PAYMENT_COLORS[key],
      bg: PAYMENT_BGS[key],
    };
  });
});

const selectedPaymentLabel = computed(() =>
  selectedPayment.value ? PAYMENT_LABELS[selectedPayment.value] : '',
);

const paymentDetailOrders = computed(() => {
  if (!selectedPayment.value || !report.value?.orders) return [];
  return report.value.orders.filter((o) => orderMatchesPayment(o, selectedPayment.value!));
});

const paymentDetailTotal = computed(() => {
  if (!selectedPayment.value) return 0;
  return paymentDetailOrders.value.reduce(
    (sum, o) => sum + orderPaymentAmount(o, selectedPayment.value!),
    0,
  );
});

const sourceRows = computed(() => {
  if (!report.value) return [];
  const total = report.value.revenue || 1;
  return [
    {
      key: 'pos',
      label: '收银台',
      icon: '🛒',
      amount: report.value.bySource.pos,
      percent: Math.round((report.value.bySource.pos / total) * 100),
      color: '#4f46e5',
      bg: '#eef2ff',
    },
    {
      key: 'scan',
      label: '扫码点餐',
      icon: '📱',
      amount: report.value.bySource.scan,
      percent: Math.round((report.value.bySource.scan / total) * 100),
      color: '#0891b2',
      bg: '#ecfeff',
    },
  ];
});

const kpiCards = computed(() => {
  if (!report.value) return [];
  return [
    {
      key: 'orders' as KpiKey,
      icon: '📦',
      label: '订单数',
      value: String(report.value.orderCount),
      bg: '#eef2ff',
      color: '#4f46e5',
    },
    {
      key: 'revenue' as KpiKey,
      icon: '💶',
      label: '总销售额',
      value: formatMoney(report.value.revenue),
      bg: '#ecfdf5',
      color: '#059669',
    },
    {
      key: 'aov' as KpiKey,
      icon: '📈',
      label: '客单价',
      value: formatMoney(report.value.averageOrderValue),
      bg: '#fff7ed',
      color: '#ea580c',
    },
  ];
});

const detailTitle = computed(() => {
  const map: Record<KpiKey, string> = {
    orders: '订单明细',
    revenue: '每日销售趋势',
    aov: '客单价分析',
  };
  return selectedKpi.value ? map[selectedKpi.value] : '';
});

const detailSubtitle = computed(() => {
  const map: Record<KpiKey, string> = {
    orders: '该时段全部已支付订单，点击行可展开商品',
    revenue: '按天汇总销售额与订单数',
    aov: '单笔订单金额分布及与均价的对比',
  };
  return selectedKpi.value ? map[selectedKpi.value] : '';
});

const modalOpen = computed(() => !!selectedKpi.value || !!selectedPayment.value);

const modalTitle = computed(() => {
  if (selectedPayment.value) return `${selectedPaymentLabel.value} — 订单明细`;
  return detailTitle.value;
});

const modalSubtitle = computed(() => {
  if (selectedPayment.value) return '该支付方式下的全部订单';
  return detailSubtitle.value;
});

function closeModal() {
  selectedKpi.value = null;
  selectedPayment.value = null;
  expandedOrderId.value = null;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && modalOpen.value) closeModal();
}

function openKpiModal(key: KpiKey) {
  expandedOrderId.value = null;
  selectedPayment.value = null;
  selectedKpi.value = key;
}

function openPaymentModal(key: PaymentKey) {
  expandedOrderId.value = null;
  selectedKpi.value = null;
  selectedPayment.value = key;
}

const orderDetails = computed(() => report.value?.orders ?? []);
const dailyTrend = computed(() => report.value?.dailyTrend ?? []);
const aovDetail = computed(() => report.value?.aovDetail ?? null);

const hasDetailData = computed(() => {
  if (!selectedKpi.value || !report.value) return false;
  if (selectedKpi.value === 'orders') return report.value.orders != null;
  if (selectedKpi.value === 'revenue') return report.value.dailyTrend != null;
  return report.value.aovDetail != null;
});

function dailyRevenuePercent(revenue: number) {
  if (!report.value?.revenue) return 0;
  return Math.round((revenue / report.value.revenue) * 100);
}

function orderDiffLabel(total: number, avg: number) {
  const diff = total - avg;
  if (Math.abs(diff) < 50) return '接近均价';
  const prefix = diff > 0 ? '+' : '';
  return `${prefix}${formatMoney(diff)}`;
}

function orderDiffClass(total: number, avg: number) {
  const diff = total - avg;
  if (Math.abs(diff) < 50) return 'neutral';
  return diff > 0 ? 'up' : 'down';
}

function toggleOrderExpand(orderId: string) {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId;
}

async function loadReport() {
  loading.value = true;
  error.value = '';
  closeModal();
  try {
    report.value = await fetchSalesReport(startDate.value, endDate.value, storeId);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载报表失败';
    report.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  setRange('week');
  void loadReport();
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.reports {
  display: grid;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 6px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.subtitle {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.period-badge {
  padding: 8px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  box-shadow: var(--shadow-xs);
  white-space: nowrap;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.toolbar {
  padding: 20px;
}

.toolbar-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
}

.field-group {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex: 1;
  min-width: 280px;
}

.field {
  display: grid;
  gap: 6px;
  flex: 1;
}

.field span {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.field input {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 9px 12px;
  background: var(--surface-muted);
  color: var(--text);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-ring);
  background: white;
}

.range-sep {
  color: var(--text-muted);
  padding-bottom: 10px;
  font-size: 14px;
}

.presets {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.preset-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  padding: 7px 14px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}

.preset-btn:hover {
  color: var(--text);
}

.preset-btn.active {
  background: white;
  color: var(--primary);
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}

.run-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: var(--primary);
  color: white;
  padding: 10px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}

.run-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.run-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.run-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 13px;
}

.alert.error {
  color: var(--error);
  background: var(--error-light);
  border: 1px solid #fecaca;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.kpi-card {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  text-align: left;
  border: 2px solid transparent;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}

.kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.kpi-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-ring);
}

.kpi-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.detail-panel {
  padding: 0;
  overflow: hidden;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 0;
}

.detail-panel-head h2 {
  font-size: 16px;
  font-weight: 600;
}

.detail-panel-head p {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
}

.close-btn {
  border: 1px solid var(--border);
  background: white;
  color: var(--text-secondary);
  border-radius: var(--radius);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.close-btn:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.detail-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 32px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.spinner.dark {
  border-color: rgba(79, 70, 229, 0.2);
  border-top-color: var(--primary);
}

.detail-content {
  padding-bottom: 4px;
}

.clickable {
  cursor: pointer;
}

.expand-row td {
  background: var(--surface-muted);
  padding: 0 12px 12px !important;
}

.item-lines {
  list-style: none;
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.item-lines li {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.tag {
  margin-left: 8px;
  padding: 2px 8px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.aov-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 20px 16px;
}

.aov-stat {
  padding: 14px 16px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: grid;
  gap: 6px;
}

.aov-stat span {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.aov-stat strong {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.table-caption {
  padding: 0 20px 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.diff-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.diff-badge.up {
  background: #ecfdf5;
  color: #059669;
}

.diff-badge.down {
  background: #fef2f2;
  color: #dc2626;
}

.diff-badge.neutral {
  background: #f1f5f9;
  color: var(--text-secondary);
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 22px;
  flex-shrink: 0;
}

.kpi-body {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.kpi-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.kpi-card.revenue .kpi-value {
  color: var(--success);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.payment-section {
  display: grid;
  gap: 16px;
}

.section-head h2 {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.section-head p {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
}

.payment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 280px));
  gap: 14px;
}

.payment-card {
  padding: 18px;
  display: grid;
  gap: 6px;
  text-align: left;
  border: 2px solid transparent;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
}

.payment-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.payment-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-ring);
}

.payment-card.empty {
  opacity: 0.72;
}

.payment-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.payment-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 20px;
}

.payment-percent {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.payment-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.payment-amount {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.payment-orders {
  font-size: 12px;
  color: var(--text-muted);
}

.payment-detail {
  margin-top: 0;
}

.payment-detail-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.payment-detail-summary strong {
  font-size: 18px;
  color: var(--text);
}

.source-only {
  max-width: 480px;
}

.detail-card {
  padding: 0;
  overflow: hidden;
}

.card-header {
  padding: 20px 20px 0;
}

.card-header h2 {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.card-header p {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
}

.table-wrap {
  padding: 16px 20px 20px;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border);
}

.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--border-light, #f1f5f9);
}

.data-table tbody tr:hover {
  background: var(--surface-muted);
}

.data-table tfoot td {
  padding: 14px 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-top: 1px solid var(--border);
  background: var(--surface-muted);
}

.align-right {
  text-align: right;
}

.method-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.percent-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.mini-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 2px;
  transition: width 0.4s ease;
}

.percent-cell span:last-child {
  width: 36px;
  text-align: right;
  font-size: 13px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.amount-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.total-cell {
  font-size: 15px;
  color: var(--text);
}

.source-cards {
  padding: 16px 20px 20px;
  display: grid;
  gap: 14px;
}

.source-item {
  padding: 16px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.source-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.source-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 16px;
}

.source-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.source-percent {
  font-size: 13px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.source-amount {
  display: block;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}

.source-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.source-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 10px;
  opacity: 0.6;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.skeleton {
  animation: pulse 1.5s ease-in-out infinite;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  border: none;
}

.kpi-skeleton {
  height: 96px;
}

.chart-skeleton {
  height: 280px;
  grid-column: span 1;
}

.skeleton-grid .chart-skeleton:first-of-type {
  grid-column: 1 / 3;
}

@keyframes pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 960px) {
  .payment-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .aov-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid,
  .skeleton-grid {
    grid-template-columns: 1fr;
  }

  .skeleton-grid .chart-skeleton {
    grid-column: span 1;
  }

  .toolbar-form {
    flex-direction: column;
    align-items: stretch;
  }

  .field-group {
    flex-direction: column;
    align-items: stretch;
    min-width: 0;
  }

  .range-sep {
    display: none;
  }

  .presets {
    width: 100%;
    justify-content: stretch;
  }

  .preset-btn {
    flex: 1;
    text-align: center;
  }

  .run-btn {
    width: 100%;
    justify-content: center;
  }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 24px;
  animation: fadeIn 0.15s ease;
}

.modal {
  width: min(920px, 100%);
  max-height: min(85vh, 900px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.modal-header p {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
}

.modal-close {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  background: white;
  border-radius: var(--radius);
  font-size: 22px;
  line-height: 1;
  color: var(--text-secondary);
  flex-shrink: 0;
  cursor: pointer;
}

.modal-close:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.modal-body {
  padding: 16px 22px 22px;
  overflow-y: auto;
  flex: 1;
}

.modal-summary {
  padding: 0 0 14px !important;
}

.table-wrap.flush {
  padding: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 640px) {
  .modal-backdrop {
    padding: 12px;
    align-items: flex-end;
  }

  .modal {
    max-height: 92vh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}
</style>
