<template>
  <div class="home-page">
    <header class="topbar">
      <div class="brand">
        <span class="logo">🧋</span>
        <div>
          <strong>Bubble Tea SaaS</strong>
          <small>管理后台</small>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </header>

    <main class="content">
      <section class="welcome-card">
        <h1>你好，{{ user?.name }}</h1>
        <p>你已成功登录，后续可在这里扩展菜单管理、报表等功能。</p>
      </section>

      <section class="info-grid">
        <article class="info-card">
          <span class="label">角色</span>
          <strong>{{ roleLabel }}</strong>
        </article>
        <article class="info-card">
          <span class="label">邮箱</span>
          <strong>{{ user?.email }}</strong>
        </article>
        <article class="info-card">
          <span class="label">租户 ID</span>
          <strong class="mono">{{ user?.tenantId }}</strong>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { clearSession, getSession } from '../api/auth';

const router = useRouter();
const session = getSession();
const user = session?.user;

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    tenant_admin: '店长 / 管理员',
    manager: '经理',
    cashier: '收银员',
  };
  return user ? map[user.role] ?? user.role : '';
});

function handleLogout() {
  clearSession();
  router.push('/login');
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #faf6f0 0%, #f7f3ee 100%);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid #eadfce;
  backdrop-filter: blur(8px);
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
  font-size: 16px;
}

.brand small {
  color: #8a7b6d;
}

.logout-btn {
  border: 1px solid #dcc6ae;
  background: white;
  color: #6d4520;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
}

.content {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 48px;
  display: grid;
  gap: 24px;
}

.welcome-card,
.info-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #eadfce;
  box-shadow: 0 12px 30px rgba(74, 45, 18, 0.06);
}

.welcome-card {
  padding: 28px;
}

.welcome-card h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.welcome-card p {
  color: #8a7b6d;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-card {
  padding: 20px;
  display: grid;
  gap: 8px;
}

.label {
  color: #8a7b6d;
  font-size: 13px;
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
  word-break: break-all;
}

@media (max-width: 760px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
