import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import DashboardView from '../views/DashboardView.vue';
import BookingView from '../views/BookingView.vue';
import RoomsOccupancyView from '../views/RoomsOccupancyView.vue';
import PetsManagementView from '../views/PetsManagementView.vue';
import Settings from '../views/Settings.vue';
import ResourceManagementView from '../views/ResourceManagementView.vue';

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
    path: '/reservation',
    name: 'Reservation',
    component: BookingView,
    meta: { requiresAuth: true }
  },
  {
    path: '/rooms',
    name: 'Rooms',
    component: RoomsOccupancyView,
    meta: { requiresAuth: true }
  },
  {
    path: '/pets',
    name: 'Pets',
    component: PetsManagementView,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'Customers',
    component: PetsManagementView,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources',
    name: 'ResourceManagement',
    component: ResourceManagementView,
    meta: { requiresAuth: true, requireAdmin: true }
  },
  {
    path: '/staff',
    name: 'Staff',
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
