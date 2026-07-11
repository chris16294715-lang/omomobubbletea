<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="bubble b1"></div>
      <div class="bubble b2"></div>
      <div class="bubble b3"></div>
    </div>

    <div class="login-shell">
      <section class="brand-panel">
        <div class="logo">🧋</div>
        <h1>Bubble Tea SaaS</h1>
        <p>奶茶店扫码点单 · 收银 · 管理后台</p>
        <ul>
          <li>菜单与分类管理</li>
          <li>扫码点单与收银台</li>
          <li>销售报表与数据分析</li>
        </ul>
      </section>

      <section class="form-panel">
        <div class="form-card">
          <h2>欢迎回来</h2>
          <p class="subtitle">使用管理员或收银员账号登录</p>

          <form @submit.prevent="handleSubmit">
            <label>
              <span>邮箱</span>
              <input
                v-model="email"
                type="email"
                placeholder="admin@demo.com"
                autocomplete="username"
                required
              />
            </label>

            <label>
              <span>密码</span>
              <input
                v-model="password"
                type="password"
                placeholder="请输入密码"
                autocomplete="current-password"
                required
              />
            </label>

            <p v-if="error" class="error">{{ error }}</p>

            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? '登录中...' : '登录' }}
            </button>
          </form>

          <div class="demo-tip">
            <strong>演示账号</strong>
            <span>admin@demo.com / admin123</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login, saveSession } from '../api/auth';

const router = useRouter();
const email = ref('admin@demo.com');
const password = ref('admin123');
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const result = await login(email.value.trim(), password.value);
    saveSession(result.accessToken, result.user);
    await router.push('/home');
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 20%, rgba(201, 149, 107, 0.25), transparent 35%),
    radial-gradient(circle at 85% 80%, rgba(139, 90, 43, 0.18), transparent 40%),
    linear-gradient(135deg, #faf6f0 0%, #f0e4d6 100%);
}

.bubble {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(2px);
}

.b1 {
  width: 180px;
  height: 180px;
  top: 10%;
  right: 12%;
}

.b2 {
  width: 120px;
  height: 120px;
  bottom: 16%;
  left: 8%;
}

.b3 {
  width: 80px;
  height: 80px;
  top: 55%;
  left: 45%;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(960px, 100%);
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--card);
  border-radius: 28px;
  box-shadow: var(--shadow);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.brand-panel {
  padding: 48px 40px;
  background: linear-gradient(160deg, #8b5a2b 0%, #a7713f 55%, #c9956b 100%);
  color: #fff8f0;
}

.logo {
  font-size: 48px;
  margin-bottom: 16px;
}

.brand-panel h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.brand-panel p {
  opacity: 0.92;
  margin-bottom: 28px;
}

.brand-panel ul {
  list-style: none;
  display: grid;
  gap: 12px;
}

.brand-panel li::before {
  content: '•';
  margin-right: 8px;
  color: #ffe8cc;
}

.form-panel {
  padding: 48px 40px;
  display: grid;
  place-items: center;
}

.form-card {
  width: 100%;
  max-width: 360px;
}

.form-card h2 {
  font-size: 26px;
  margin-bottom: 6px;
}

.subtitle {
  color: var(--muted);
  margin-bottom: 28px;
}

form {
  display: grid;
  gap: 18px;
}

label {
  display: grid;
  gap: 8px;
}

label span {
  font-size: 14px;
  font-weight: 500;
}

input {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  background: #fffdfb;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(201, 149, 107, 0.18);
}

.error {
  color: var(--error);
  font-size: 14px;
}

.submit-btn {
  margin-top: 4px;
  border: none;
  border-radius: 12px;
  padding: 13px 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.demo-tip {
  margin-top: 24px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #faf3ea;
  border: 1px dashed #e2c9ad;
  display: grid;
  gap: 4px;
  font-size: 13px;
  color: var(--muted);
}

.demo-tip strong {
  color: var(--text);
}

@media (max-width: 820px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    padding: 32px 28px;
  }

  .form-panel {
    padding: 32px 28px 40px;
  }
}
</style>
