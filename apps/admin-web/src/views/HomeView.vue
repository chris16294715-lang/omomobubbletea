<template>
  <AdminLayout subtitle="管理后台">
    <section class="welcome-card">
      <h1>你好，{{ user?.name }}</h1>
      <p>欢迎进入奶茶店管理后台。</p>
    </section>

    <section v-if="canManageMenu" class="quick-actions">
      <router-link to="/menu" class="action-card">
        <span class="icon">📋</span>
        <strong>菜单管理</strong>
        <small>分类与菜品的添加、编辑、删除</small>
      </router-link>
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
    </section>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AdminLayout from '../components/AdminLayout.vue';
import { getSession } from '../api/auth';

const session = getSession();
const user = session?.user;

const canManageMenu = computed(
  () => user?.role === 'tenant_admin' || user?.role === 'manager',
);

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    tenant_admin: '店长 / 管理员',
    manager: '经理',
    cashier: '收银员',
  };
  return user ? map[user.role] ?? user.role : '';
});
</script>

<style scoped>
.welcome-card,
.info-card,
.action-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #eadfce;
  box-shadow: 0 12px 30px rgba(74, 45, 18, 0.06);
}

.welcome-card {
  padding: 28px;
  margin-bottom: 24px;
}

.welcome-card h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.welcome-card p {
  color: #8a7b6d;
}

.quick-actions {
  margin-bottom: 24px;
}

.action-card {
  display: grid;
  gap: 6px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s;
}

.action-card:hover {
  transform: translateY(-2px);
}

.action-card .icon {
  font-size: 28px;
}

.action-card small {
  color: #8a7b6d;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

@media (max-width: 760px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
