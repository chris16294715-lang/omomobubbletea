<template>
  <div class="layout">
    <header class="topbar">
      <div class="brand">
        <span class="logo">🧋</span>
        <div>
          <strong>Bubble Tea SaaS</strong>
          <small>{{ subtitle }}</small>
        </div>
      </div>
      <nav class="nav">
        <router-link to="/home">首页</router-link>
        <router-link v-if="canManageMenu" to="/menu">菜单管理</router-link>
      </nav>
      <div class="user-area">
        <span>{{ user?.name }}</span>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { clearSession, getSession } from '../api/auth';

defineProps<{ subtitle?: string }>();

const router = useRouter();
const session = getSession();
const user = session?.user;

const canManageMenu = computed(
  () => user?.role === 'tenant_admin' || user?.role === 'manager',
);

function handleLogout() {
  clearSession();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: linear-gradient(180deg, #faf6f0 0%, #f7f3ee 100%);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #eadfce;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 28px;
}

.brand strong {
  display: block;
}

.brand small {
  color: #8a7b6d;
}

.nav {
  display: flex;
  gap: 12px;
}

.nav a {
  color: #6d4520;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
}

.nav a.router-link-active {
  background: #f3e4d4;
  font-weight: 600;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6d4520;
}

.logout-btn {
  border: 1px solid #dcc6ae;
  background: white;
  color: #6d4520;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}
</style>
