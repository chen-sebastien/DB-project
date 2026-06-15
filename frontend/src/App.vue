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
              <!-- 修改個人密碼快捷按鈕 -->
              <v-btn
                v-if="currentUser"
                icon="mdi-key-variant"
                variant="text"
                size="small"
                color="orange-darken-3"
                class="ml-auto"
                @click="openChangePasswordDialog"
                title="修改個人密碼"
              ></v-btn>
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

      <!-- 修改個人密碼對話框 -->
      <v-dialog v-model="passwordDialog" max-width="450px" persistent>
        <v-card rounded="xl" class="pa-4">
          <v-card-title class="font-weight-bold text-brown-darken-4 d-flex align-center pb-2">
            <v-icon icon="mdi-key-outline" color="orange-darken-2" class="mr-2"></v-icon>
            修改個人登入密碼
          </v-card-title>
          
          <v-card-text>
            <v-form ref="passwordForm" @submit.prevent="handleChangePassword">
              <v-text-field
                v-model="pwdData.oldPassword"
                label="目前的舊密碼"
                type="password"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-3"
                required
                :rules="[v => !!v || '請輸入舊密碼']"
              ></v-text-field>

              <v-text-field
                v-model="pwdData.newPassword"
                label="設定新密碼"
                type="password"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-3"
                required
                :rules="[
                  v => !!v || '請輸入新密碼',
                  v => (v && v.length >= 6) || '密碼長度需至少 6 位字元'
                ]"
              ></v-text-field>

              <v-text-field
                v-model="pwdData.confirmPassword"
                label="再次確認新密碼"
                type="password"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-4"
                required
                :rules="[
                  v => !!v || '請再次輸入新密碼',
                  v => v === pwdData.newPassword || '兩次輸入的新密碼不一致'
                ]"
              ></v-text-field>

              <v-alert
                v-if="pwdError"
                type="error"
                density="compact"
                variant="tonal"
                class="mb-4 text-left font-weight-bold"
              >
                {{ pwdError }}
              </v-alert>

              <div class="d-flex justify-end">
                <v-btn
                  variant="text"
                  rounded="pill"
                  color="grey-darken-1"
                  class="font-weight-bold mr-2"
                  @click="closeChangePasswordDialog"
                >
                  取消
                </v-btn>
                <v-btn
                  type="submit"
                  color="orange-darken-2"
                  rounded="pill"
                  class="font-weight-bold px-6 text-white"
                  :loading="pwdLoading"
                >
                  確認修改
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- 提示通知氣泡 -->
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top">
        {{ snackbar.message }}
      </v-snackbar>
    </template>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const drawer = ref(true);
const route = useRoute();
const router = useRouter();

// 判斷是否為登入頁
const isLoginPage = computed(() => route.path === '/login');

// 當前使用者資訊
const currentUser = ref<any>(null);

const updateCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  currentUser.value = userStr ? JSON.parse(userStr) : null;
};

// 監聽路由改變以更新使用者身分，解決登入/登出切換身分不刷新的 Bug
watch(() => route.path, () => {
  updateCurrentUser();
}, { immediate: true });

// 修改密碼相關響應式資料
const passwordDialog = ref(false);
const passwordForm = ref<any>(null);
const pwdLoading = ref(false);
const pwdError = ref('');
const pwdData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 提示控制
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
});

const openChangePasswordDialog = () => {
  pwdError.value = '';
  pwdData.oldPassword = '';
  pwdData.newPassword = '';
  pwdData.confirmPassword = '';
  passwordDialog.value = true;
};

const closeChangePasswordDialog = () => {
  passwordDialog.value = false;
  if (passwordForm.value) passwordForm.value.resetValidation();
};

const handleChangePassword = async () => {
  if (!pwdData.oldPassword || !pwdData.newPassword || !pwdData.confirmPassword) return;
  if (pwdData.newPassword !== pwdData.confirmPassword) {
    pwdError.value = '新密碼與確認密碼不一致';
    return;
  }
  if (pwdData.newPassword.length < 6) {
    pwdError.value = '新密碼長度必須至少為 6 個字元';
    return;
  }

  pwdLoading.value = true;
  pwdError.value = '';

  try {
    const res = await axios.post('http://localhost:3000/api/auth/change-password', {
      oldPassword: pwdData.oldPassword,
      newPassword: pwdData.newPassword
    });

    if (res.data.success) {
      snackbar.message = '密碼修改成功！下次登入請使用新密碼。';
      snackbar.color = 'success';
      snackbar.show = true;
      closeChangePasswordDialog();
    }
  } catch (error: any) {
    console.error('Failed to change password:', error);
    pwdError.value = error.response?.data?.error || '修改密碼失敗，請確認舊密碼是否輸入正確';
  } finally {
    pwdLoading.value = false;
  }
};

// 登出處理
const handleLogout = () => {
  const user = currentUser.value;
  if (user) {
    console.log(`${user.name} 已登出`);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  currentUser.value = null;
  router.push('/login');
};

onMounted(() => {
  // 網頁重新整理時，自動載入已儲存的 Token 至 Axios
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  updateCurrentUser();
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