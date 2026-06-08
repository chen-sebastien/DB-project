<template>
  <v-app :style="isLoginPage ? '' : 'background-color: #FAF8F5;'">
    <!-- 登入頁直接渲染 -->
    <v-main v-if="isLoginPage" class="pa-0">
      <router-view></router-view>
    </v-main>

    <!-- 系統主頁面（帶有側邊導覽列與主內容區） -->
    <template v-else>
      <!-- 左側高質感側邊導覽列 -->
      <v-navigation-drawer
        v-model="drawer"
        permanent
        elevation="3"
        class="border-0 glass-sidebar"
        width="280"
        style="background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(15px);"
      >
        <!-- 店家 Logo -->
        <div class="pa-6 d-flex align-center justify-center">
          <v-avatar color="orange-darken-2" size="40" class="text-white mr-3 elevation-1">
            <v-icon icon="mdi-paw"></v-icon>
          </v-avatar>
          <div class="d-flex flex-column">
            <span class="font-weight-black text-h6 text-brown-darken-4" style="line-height: 1.2;">FurEver Suites</span>
            <span class="text-caption text-brown-lighten-2">寵物奢華度假村系統</span>
          </div>
        </div>

        <v-divider class="mx-4 mb-4" color="brown-lighten-4"></v-divider>

        <!-- 員工登入資訊卡片 -->
        <div class="px-4 mb-4">
          <v-card flat rounded="xl" color="orange-lighten-5" class="pa-4 border" style="border-color: #FFE0B2 !important;">
            <div class="d-flex align-center">
              <v-avatar color="orange-darken-1" size="44" class="text-white mr-3 font-weight-bold">
                {{ currentUser?.name?.substring(0, 1) || '員' }}
              </v-avatar>
              <div class="d-flex flex-column text-left">
                <span class="font-weight-bold text-brown-darken-4 text-body-1">{{ currentUser?.name || '未知員工' }}</span>
                <v-chip
                  :color="currentUser?.role === 'Admin' ? 'red-darken-2' : 'orange-darken-3'"
                  size="x-small"
                  variant="flat"
                  class="font-weight-bold mt-1 px-2 text-white"
                  style="align-self: flex-start;"
                >
                  {{ currentUser?.role === 'Admin' ? '👑 老闆/管理員' : '💼 服務夥伴' }}
                </v-chip>
              </div>
            </div>
          </v-card>
        </div>

        <!-- 功能選單列表 -->
        <v-list density="comfortable" nav class="px-4">
          <v-list-item
            to="/"
            prepend-icon="mdi-monitor-dashboard"
            title="營運數據總覽"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
            exact
          ></v-list-item>

          <v-list-item
            to="/booking"
            prepend-icon="mdi-calendar-plus"
            title="奢華預約中心"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
          ></v-list-item>

          <v-list-item
            v-if="currentUser?.role === 'Admin'"
            to="/settings"
            prepend-icon="mdi-cog-outline"
            title="系統安全設定"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
          ></v-list-item>
        </v-list>

        <!-- 底部登出按鈕 -->
        <template v-slot:append>
          <div class="pa-4">
            <v-btn
              block
              color="brown-lighten-4"
              variant="flat"
              rounded="xl"
              class="font-weight-bold text-brown-darken-3 py-3"
              prepend-icon="mdi-logout"
              @click="handleLogout"
            >
              安全登出
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- 右側主要內容呈現區 -->
      <v-main style="background-color: #FAF8F5;">
        <v-container fluid class="pa-6" style="max-width: 1400px; margin: 0 auto;">
          <!-- 帶有轉場動畫的路由視圖 -->
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </v-container>
      </v-main>
    </template>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const drawer = ref(true);
const route = useRoute();
const router = useRouter();

// 判斷是否為登入頁
const isLoginPage = computed(() => route.path === '/login');

// 取得當前使用者資訊
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
});

// 登出處理
const handleLogout = () => {
  const user = currentUser.value;
  if (user) {
    // 呼叫記錄日誌（可選，直接在登出時清除 Token）
    console.log(`${user.name} 已登出`);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  router.push('/login');
};

onMounted(() => {
  // 網頁重新整理時，自動載入已儲存的 Token 至 Axios
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
});
</script>

<style>
/* 側邊欄磨砂玻璃樣式 */
.glass-sidebar {
  border-right: 1px solid rgba(141, 110, 99, 0.12) !important;
}

/* 全域主體字型與轉場動畫 */
body {
  font-family: 'Inter', 'Outfit', 'Noto Sans TC', sans-serif !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>