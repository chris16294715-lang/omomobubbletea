import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import { getSession } from '../api/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/home', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const session = getSession();
  if (to.meta.requiresAuth && !session) {
    return { name: 'login' };
  }
  if (to.name === 'login' && session) {
    return { name: 'home' };
  }
});

export default router;
