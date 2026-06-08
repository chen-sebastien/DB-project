<template>
  <v-container class="fill-height justify-center align-center" fluid style="background-color: #FFF8E1;">
    <v-card 
      width="420" 
      class="pa-8 border text-center glass-card" 
      elevation="8" 
      rounded="xl"
    >
      <v-avatar color="orange-darken-2" size="64" class="mb-4 text-white elevation-2">
        <v-icon icon="mdi-paw" size="36"></v-icon>
      </v-avatar>
      
      <h2 class="font-weight-black text-brown-darken-4 text-h5 mb-1">FurEver Suites</h2>
      <p class="text-subtitle-2 text-brown-lighten-1 mb-6">寵物奢華度假村服務管理系統</p>

      <v-form @submit.prevent="handleLogin" ref="loginForm">
        <v-text-field
          v-model="username"
          label="登入帳號"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          color="orange-darken-2"
          rounded="lg"
          class="mb-3"
          :rules="[v => !!v || '請輸入帳號']"
          required
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="安全密碼"
          prepend-inner-icon="mdi-lock-outline"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          color="orange-darken-2"
          rounded="lg"
          class="mb-6"
          :rules="[v => !!v || '請輸入密碼']"
          required
        ></v-text-field>

        <v-btn
          type="submit"
          color="orange-darken-2"
          size="large"
          block
          rounded="xl"
          class="font-weight-bold elevation-2 py-3"
          :loading="loading"
        >
          安全登入
        </v-btn>
      </v-form>

      <v-alert
        v-if="errorMessage"
        type="error"
        density="compact"
        variant="tonal"
        class="mt-4 text-left font-weight-bold"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <div class="text-caption text-grey-darken-1 mt-6">
        預設測試帳號: <strong class="text-brown-darken-2">admin</strong> / 密碼: <strong class="text-brown-darken-2">admin123</strong>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();

const handleLogin = async () => {
  if (!username.value || !password.value) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: username.value,
      password: password.value
    });

    if (response.data.success) {
      // 儲存 Token 與使用者資訊
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // 更新全域 Axios Authorization Header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      // 導向首頁
      router.push('/');
    }
  } catch (error: any) {
    console.error('Login failed:', error);
    errorMessage.value = error.response?.data?.error || '登入失敗，請檢查網路或密碼';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
.glass-card {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
}
</style>
