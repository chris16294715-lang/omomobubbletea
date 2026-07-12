import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import MenuManageView from '../views/MenuManageView.vue';
import { getSession } from '../api/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/home', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    {
      path: '/menu',
      name: 'menu',
      component: MenuManageView,
      meta: { requiresAuth: true, roles: ['tenant_admin', 'manager'] },
    },
  ],
});

router.beforeEach((to) => {
  const session = getSession();
  if (to.meta.requiresAuth && !session) {
    return { name: 'login' };
  }
  if (to.meta.roles && session) {
    const roles = to.meta.roles as string[];
    if (!roles.includes(session.user.role)) {
      return { name: 'home' };
    }
  }
  if (to.name === 'login' && session) {
    return { name: 'home' };
  }
});

export default router;
