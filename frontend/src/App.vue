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
        <div class="pa-4 d-flex align-center justify-center flex-column cursor-pointer" @click="handleLogoClick" title="回儀表板並重整">
          <img
            src="/pawnest_logo.jpg?v=3"
            style="max-width: 160px; max-height: 100px; object-fit: contain;"
            class="mb-1"
            alt="PawNest Logo"
          />
          <span class="text-caption text-brown-lighten-1 font-weight-medium" style="letter-spacing: 0.05em;">寵物住宿 · 美容服務 · 餵食照護</span>
        </div>

        <v-divider class="mx-4 mb-4" color="brown-lighten-4"></v-divider>

        <!-- 員工登入資訊卡片 -->
        <div class="px-4 mb-4">
          <v-card 
            flat 
            rounded="xl" 
            color="orange-lighten-5" 
            class="pa-4 border cursor-pointer employee-card hover-scale transition-swing" 
            style="border-color: #FFE0B2 !important;"
            @click="openProfileDialog"
          >
            <div class="d-flex align-center">
              <v-avatar color="orange-darken-1" size="44" class="text-white mr-3 font-weight-bold elevation-1">
                <v-img v-if="currentUser?.avatar" :src="currentUser.avatar" cover></v-img>
                <span v-else>{{ currentUser?.name?.substring(0, 1) || '員' }}</span>
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
            title="儀表板"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
            exact
          ></v-list-item>

          <v-list-item
            to="/reservation"
            prepend-icon="mdi-calendar-plus"
            title="預約中心"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
          ></v-list-item>

          <v-list-item
            to="/rooms"
            prepend-icon="mdi-bed-outline"
            title="房間管理"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
          ></v-list-item>

          <v-list-item
            to="/pets"
            prepend-icon="mdi-dog-side"
            title="寵物檔案"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
          ></v-list-item>

          <v-list-item
            to="/customers"
            prepend-icon="mdi-account-multiple-outline"
            title="顧客管理"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
          ></v-list-item>

          <v-list-item
            v-if="currentUser?.role === 'Admin'"
            to="/resources"
            prepend-icon="mdi-domain"
            title="資源管理"
            rounded="xl"
            color="orange-darken-2"
            class="mb-2 font-weight-bold text-brown-darken-3"
          ></v-list-item>

          <v-list-item
            v-if="currentUser?.role === 'Admin'"
            to="/staff"
            prepend-icon="mdi-cog-outline"
            title="員工管理"
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
          <!-- 全域麵包屑導航 -->
          <v-breadcrumbs :items="breadcrumbs" color="orange-darken-3" class="mb-4 pa-0 text-caption font-weight-bold">
            <template v-slot:divider>
              <v-icon icon="mdi-chevron-right" size="14" color="grey-lighten-1"></v-icon>
            </template>
          </v-breadcrumbs>

          <!-- 帶有轉場動畫的路由視圖 -->
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </v-container>
      </v-main>

      <!-- 個人檔案與密碼設定對話框 -->
      <v-dialog v-model="profileDialog" max-width="500px" persistent>
        <v-card rounded="xl" class="pa-4 border">
          <v-card-title class="font-weight-bold text-brown-darken-4 d-flex align-center pb-2 border-b">
            <v-icon icon="mdi-account-cog-outline" color="orange-darken-2" class="mr-2"></v-icon>
            修改個人帳號細節
          </v-card-title>
          
          <v-card-text class="pt-4">
            <v-form ref="profileForm" @submit.prevent="handleUpdateProfile">
              <!-- 頭貼設定區 -->
              <div class="d-flex flex-column align-center mb-4">
                <v-avatar color="orange-lighten-5" size="80" class="mb-3 border elevation-2" style="border-color: #FFE0B2 !important;">
                  <v-img v-if="profileData.avatar" :src="profileData.avatar" cover></v-img>
                  <span v-else class="text-h4 font-weight-bold text-orange-darken-3">
                    {{ profileData.name?.substring(0, 1) || '員' }}
                  </span>
                </v-avatar>
                
                <div class="d-flex gap-2 mb-2" style="gap: 8px;">
                  <v-btn size="small" variant="outlined" color="orange-darken-2" rounded="pill" prepend-icon="mdi-upload" @click="triggerFileSelect">
                    上傳照片
                  </v-btn>
                  <v-btn size="small" variant="text" color="grey-darken-1" rounded="pill" @click="profileData.avatar = null" v-if="profileData.avatar">
                    清除
                  </v-btn>
                  <input type="file" ref="fileInput" accept="image/*" class="d-none" @change="onAvatarFileChange" />
                </div>
                
                <div class="text-caption text-grey mb-3">支援 JPG/PNG，不超過 2MB</div>
                
                <!-- 預設卡通頭像選擇 -->
                <div class="text-caption text-brown-darken-4 font-weight-bold mb-1">或選擇內建超萌角色頭貼：</div>
                <div class="d-flex gap-2 justify-center" style="gap: 8px;">
                  <v-avatar 
                    v-for="(avatarPreset, index) in presetAvatars" 
                    :key="index" 
                    size="40" 
                    class="cursor-pointer border hover-scale transition-swing"
                    :style="profileData.avatar === avatarPreset ? 'border: 2.5px solid #E65100 !important; transform: scale(1.1);' : 'border: 1px solid rgba(0,0,0,0.1) !important;'"
                    @click="profileData.avatar = avatarPreset"
                  >
                    <v-img :src="avatarPreset" cover></v-img>
                  </v-avatar>
                </div>
              </div>

              <v-divider class="my-4"></v-divider>

              <!-- 帳號與姓名 -->
              <v-text-field
                v-model="profileData.name"
                label="真實姓名"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-3"
                required
                :rules="[v => !!v || '請輸入真實姓名']"
              ></v-text-field>

              <v-text-field
                v-model="profileData.username"
                label="登入帳號"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-3"
                required
                :rules="[v => !!v || '請輸入登入帳號']"
              ></v-text-field>

              <!-- 密碼設定 (選填) -->
              <div class="text-subtitle-2 font-weight-bold text-brown-darken-3 mb-2 text-left">🔐 安全密碼設定 (選填，若要修改密碼請填寫)</div>
              
              <v-text-field
                v-model="profileData.oldPassword"
                label="目前的舊密碼"
                type="password"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-3"
                hide-details="auto"
              ></v-text-field>

              <v-text-field
                v-model="profileData.newPassword"
                label="設定新密碼"
                type="password"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-3"
                hide-details="auto"
                :rules="[
                  v => !v || v.length >= 6 || '密碼長度需至少 6 位字元'
                ]"
              ></v-text-field>

              <v-text-field
                v-model="profileData.confirmPassword"
                label="再次確認新密碼"
                type="password"
                variant="outlined"
                color="orange-darken-2"
                rounded="lg"
                class="mb-4"
                hide-details="auto"
                :rules="[
                  v => v === profileData.newPassword || '兩次輸入的新密碼不一致'
                ]"
              ></v-text-field>

              <v-alert
                v-if="profileError"
                type="error"
                density="compact"
                variant="tonal"
                class="mb-4 text-left font-weight-bold"
              >
                {{ profileError }}
              </v-alert>

              <div class="d-flex justify-end pt-2 border-t">
                <v-btn
                  variant="text"
                  rounded="pill"
                  color="grey-darken-1"
                  class="font-weight-bold mr-2"
                  @click="closeProfileDialog"
                >
                  取消
                </v-btn>
                <v-btn
                  type="submit"
                  color="orange-darken-2"
                  rounded="pill"
                  class="font-weight-bold px-6 text-white"
                  :loading="profileLoading"
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
import apiClient from './api/client';

const drawer = ref(true);
const route = useRoute();
const router = useRouter();

const isLoginPage = computed(() => route.path === '/login');

// 麵包屑導航資料
const breadcrumbs = computed(() => {
  const items = [
    {
      title: '儀表板',
      disabled: route.path === '/',
      href: '/',
    }
  ];

  if (route.path === '/reservation') {
    items.push({
      title: '預約中心',
      disabled: true,
      href: '/reservation',
    });
  } else if (route.path === '/rooms') {
    items.push({
      title: '房間管理',
      disabled: true,
      href: '/rooms',
    });
  } else if (route.path === '/pets') {
    items.push({
      title: '寵物檔案',
      disabled: true,
      href: '/pets',
    });
  } else if (route.path === '/customers') {
    items.push({
      title: '顧客管理',
      disabled: true,
      href: '/customers',
    });
  } else if (route.path === '/resources') {
    items.push({
      title: '資源管理',
      disabled: true,
      href: '/resources',
    });
  } else if (route.path === '/staff') {
    items.push({
      title: '員工管理',
      disabled: true,
      href: '/staff',
    });
  }

  return items;
});

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

// 標題 Logo 點擊回到首頁/重整
const handleLogoClick = () => {
  if (route.path === '/') {
    window.dispatchEvent(new CustomEvent('logo-refresh'));
  } else {
    router.push('/');
  }
};

// 個人檔案與密碼對話框控制
const profileDialog = ref(false);
const profileForm = ref<any>(null);
const profileLoading = ref(false);
const profileError = ref('');
const fileInput = ref<any>(null);

const profileData = reactive({
  name: '',
  username: '',
  avatar: null as string | null,
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 內建超萌卡通動物 SVG 頭像 presets
const presetAvatars = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23FFB74D"><circle cx="50" cy="50" r="50"/><circle cx="35" cy="45" r="6" fill="%235D4037"/><circle cx="65" cy="45" r="6" fill="%235D4037"/><path d="M38,60 Q50,72 62,60" stroke="%235D4037" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M20,30 Q35,20 40,40" stroke="%235D4037" stroke-width="8" fill="none"/><path d="M80,30 Q65,20 60,40" stroke="%235D4037" stroke-width="8" fill="none"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%234FC3F7"><circle cx="50" cy="50" r="50"/><circle cx="30" cy="45" r="5" fill="%2337474F"/><circle cx="70" cy="45" r="5" fill="%2337474F"/><path d="M45,60 Q50,65 55,60" stroke="%2337474F" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M25,25 L40,35" stroke="%2337474F" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M75,25 L60,35" stroke="%2337474F" stroke-width="8" fill="none" stroke-linecap="round"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23A5D6A7"><circle cx="50" cy="50" r="50"/><circle cx="35" cy="45" r="6" fill="%232E7D32"/><circle cx="65" cy="45" r="6" fill="%232E7D32"/><path d="M40,62 Q50,52 60,62" stroke="%232E7D32" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23F48FB1"><circle cx="50" cy="50" r="50"/><circle cx="35" cy="42" r="5" fill="%23880E4F"/><circle cx="65" cy="42" r="5" fill="%23880E4F"/><path d="M42,60 Q50,68 58,60" stroke="%23880E4F" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M30,25 Q50,10 42,32" stroke="%23880E4F" stroke-width="6" fill="none"/><path d="M70,25 Q50,10 58,32" stroke="%23880E4F" stroke-width="6" fill="none"/></svg>'
];

// 提示控制
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
});

const openProfileDialog = () => {
  profileError.value = '';
  profileData.name = currentUser.value?.name || '';
  profileData.username = currentUser.value?.username || '';
  profileData.avatar = currentUser.value?.avatar || null;
  profileData.oldPassword = '';
  profileData.newPassword = '';
  profileData.confirmPassword = '';
  profileDialog.value = true;
};

const closeProfileDialog = () => {
  profileDialog.value = false;
  if (profileForm.value) profileForm.value.resetValidation();
};

const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const onAvatarFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      profileError.value = '頭像圖片不能超過 2MB';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        profileData.avatar = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  }
};

const handleUpdateProfile = async () => {
  if (!profileData.name || !profileData.username) return;
  if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
    profileError.value = '新密碼與確認密碼不一致';
    return;
  }

  profileLoading.value = true;
  profileError.value = '';

  try {
    const res = await apiClient.put('/auth/profile', {
      name: profileData.name,
      username: profileData.username,
      avatar: profileData.avatar,
      oldPassword: profileData.oldPassword || undefined,
      newPassword: profileData.newPassword || undefined
    });

    if (res.data.success) {
      snackbar.message = '個人檔案與帳號資訊修改成功！';
      snackbar.color = 'success';
      snackbar.show = true;
      
      // 更新 localStorage 與全域 state
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      currentUser.value = res.data.user;
      
      closeProfileDialog();
    }
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    profileError.value = error.response?.data?.error || '修改失敗，請確認登入帳號是否已被使用。';
  } finally {
    profileLoading.value = false;
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
  delete apiClient.defaults.headers.common['Authorization'];
  currentUser.value = null;
  router.push('/login');
};

onMounted(() => {
  // 網頁重新整理時，自動載入已儲存的 Token 至 Axios
  const token = localStorage.getItem('token');
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
  font-size: 15px !important;
}

.v-card-title {
  font-size: 1.3rem !important;
}

.v-btn {
  font-size: 0.95rem !important;
  letter-spacing: 0.05em !important;
}

.text-h5 {
  font-size: 1.45rem !important;
}

.text-h6 {
  font-size: 1.25rem !important;
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