import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import DashboardView from '../views/DashboardView.vue';
import BookingView from '../views/BookingView.vue';
import Settings from '../views/Settings.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/booking',
    name: 'Booking',
    component: BookingView,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true, requireAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由安全守衛
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      // 未登入，導向登入頁
      next({ name: 'Login' });
    } else if (to.matched.some(record => record.meta.requireAdmin) && user?.role !== 'Admin') {
      // 權限不足，導回首頁
      next({ name: 'Dashboard' });
    } else {
      next();
    }
  } else if (to.matched.some(record => record.meta.guestOnly)) {
    if (token) {
      // 已登入，避免重複進登入頁，導向首頁
      next({ name: 'Dashboard' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
