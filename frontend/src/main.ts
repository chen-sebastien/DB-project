import { createApp } from 'vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css' // 確保 MDI 圖示字型能正確載入
import App from './App.vue'
import router from './router'
import axios from 'axios'

// 全域設定 Axios 攔截器，若本地有 Token 則在發出請求前自動在 Header 帶上
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 全域攔截後端回傳的 401 (未驗證) 或 403 (Token 過期/無權限)，強制跳回登入頁
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App);
app.use(vuetify);
app.use(router);
app.mount('#app');
