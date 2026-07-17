<template>
  <div class="layout" :class="{ collapsed, 'mobile-open': mobileOpen }">
    <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />

    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="logo-mark">B</div>
        <div v-show="!collapsed" class="brand-text">
          <strong>Bubble Tea</strong>
          <small>SaaS</small>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :title="collapsed ? item.label : undefined"
          @click="mobileOpen = false"
        >
          <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
          <span v-show="!collapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button
          type="button"
          class="collapse-btn"
          :title="collapsed ? '展开菜单' : '收起菜单'"
          @click="toggleCollapsed"
        >
          <span class="collapse-icon" aria-hidden="true">{{ collapsed ? '»' : '«' }}</span>
          <span v-show="!collapsed">收起菜单</span>
        </button>
      </div>
    </aside>

    <div class="shell">
      <header class="topbar">
        <button
          type="button"
          class="icon-btn menu-toggle"
          aria-label="切换菜单"
          @click="toggleMobileOrCollapse"
        >
          ☰
        </button>
        <div class="topbar-title">
          <h1>{{ subtitle || '管理后台' }}</h1>
        </div>
        <div class="user-area">
          <div class="user-chip" :title="user?.name">
            <span class="avatar">{{ userInitial }}</span>
            <span class="user-name">{{ user?.name }}</span>
          </div>
          <button type="button" class="logout-btn" @click="handleLogout">退出</button>
        </div>
      </header>

      <main class="main" :class="{ wide }">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { clearSession, getSession } from '../api/auth';

defineProps<{ subtitle?: string; wide?: boolean }>();

const STORAGE_KEY = 'sidebarCollapsed';

const router = useRouter();
const session = getSession();
const user = session?.user;

const collapsed = ref(false);
const mobileOpen = ref(false);
const isMobile = ref(false);

const userInitial = computed(() => (user?.name?.[0] ?? '?').toUpperCase());

const canManageMenu = computed(
  () => user?.role === 'tenant_admin' || user?.role === 'manager',
);

const canViewReports = computed(
  () => user?.role === 'tenant_admin' || user?.role === 'manager',
);

const canUsePos = computed(
  () => user?.role === 'cashier' || user?.role === 'manager' || user?.role === 'tenant_admin',
);

const navItems = computed(() => {
  const items = [{ to: '/home', label: '首页', icon: '🏠' }];
  if (canUsePos.value) items.push({ to: '/pos', label: '收银点单', icon: '🛒' });
  if (canManageMenu.value) items.push({ to: '/menu', label: '菜单管理', icon: '📋' });
  if (canViewReports.value) items.push({ to: '/reports', label: '销售报表', icon: '📊' });
  return items;
});

function checkMobile() {
  isMobile.value = window.innerWidth < 900;
  if (!isMobile.value) mobileOpen.value = false;
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0');
}

function toggleMobileOrCollapse() {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value;
  } else {
    toggleCollapsed();
  }
}

function handleLogout() {
  clearSession();
  router.push('/login');
}

watch(isMobile, (mobile) => {
  if (mobile) mobileOpen.value = false;
});

onMounted(() => {
  collapsed.value = localStorage.getItem(STORAGE_KEY) === '1';
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.layout {
  --sidebar-w: 240px;
  --sidebar-collapsed-w: 72px;
  min-height: 100vh;
  display: flex;
  background: var(--bg);
}

.layout.collapsed {
  --sidebar-w: var(--sidebar-collapsed-w);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 60;
  width: var(--sidebar-w);
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
  transition: width 0.22s ease, transform 0.22s ease;
  overflow: hidden;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
  min-height: 72px;
}

.logo-mark {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 11px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.22);
}

.brand-text strong {
  display: block;
  font-size: 15px;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.brand-text small {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.layout.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}

.nav-item:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.nav-item.router-link-active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.nav-icon {
  width: 22px;
  text-align: center;
  font-size: 17px;
  flex-shrink: 0;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 12px 10px 16px;
  border-top: 1px solid var(--border);
}

.collapse-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--border);
  background: var(--surface-muted);
  color: var(--text-secondary);
  border-radius: var(--radius);
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.collapse-btn:hover {
  background: white;
  color: var(--text);
  border-color: var(--border-strong);
}

.layout.collapsed .collapse-btn {
  padding: 9px;
}

.collapse-icon {
  font-size: 16px;
  line-height: 1;
}

.shell {
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  transition: margin-left 0.22s ease;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  background: white;
  border-radius: var(--radius);
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  font-size: 16px;
  transition: border-color 0.15s, color 0.15s;
}

.icon-btn:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.menu-toggle {
  display: none;
}

.topbar-title {
  flex: 1;
  min-width: 0;
}

.topbar-title h1 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: 999px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}

.user-name {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  border: 1px solid var(--border);
  background: white;
  color: var(--text-secondary);
  border-radius: var(--radius);
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 500;
  transition: border-color 0.15s, color 0.15s;
}

.logout-btn:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.main {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 24px 56px;
}

.main.wide {
  max-width: none;
  padding-left: 28px;
  padding-right: 28px;
}

.backdrop {
  display: none;
}

@media (max-width: 899px) {
  .layout {
    --sidebar-w: 260px;
  }

  .layout.collapsed {
    --sidebar-w: 260px;
  }

  .sidebar {
    transform: translateX(-100%);
  }

  .layout.mobile-open .sidebar {
    transform: translateX(0);
    box-shadow: var(--shadow-md);
  }

  .shell {
    margin-left: 0;
  }

  .menu-toggle {
    display: grid;
  }

  .sidebar-footer .collapse-btn {
    display: none;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(15, 23, 42, 0.35);
  }
}
</style>
