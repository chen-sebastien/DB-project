<template>
  <v-container>
    <div class="text-h5 font-weight-bold mb-6" style="color: #6D4C41;">
      <v-icon icon="mdi-domain" color="brown-lighten-1" class="mr-2"></v-icon>
      房型與美容師管理 (管理員專屬)
    </div>

    <!-- 頁籤導覽 -->
    <v-tabs v-model="activeTab" color="orange-darken-3" class="mb-6 font-weight-bold">
      <v-tab value="rooms" class="text-body-1">
        <v-icon icon="mdi-bed-outline" class="mr-2"></v-icon> 住宿房間管理
      </v-tab>
      <v-tab value="groomers" class="text-body-1">
        <v-icon icon="mdi-content-cut" class="mr-2"></v-icon> 專業美容師管理
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- 房間管理窗格 -->
      <v-window-item value="rooms">
        <v-card rounded="xl" elevation="3" class="border" style="border-color: #FFCC80 !important; overflow: hidden;">
          <v-card-title class="bg-orange-lighten-4 text-brown-darken-4 font-weight-bold py-4 px-6 d-flex align-center">
            <v-icon icon="mdi-bed-outline" class="mr-2" color="orange-darken-3"></v-icon>
            房間列表
            <v-btn
              color="orange-darken-2"
              prepend-icon="mdi-plus"
              rounded="pill"
              class="ml-auto font-weight-bold text-white"
              @click="openRoomDialog"
            >
              新增房間
            </v-btn>
          </v-card-title>

          <v-card-text class="pt-6">
            <v-table hover>
              <thead>
                <tr class="bg-grey-lighten-4 text-brown-darken-3">
                  <th class="font-weight-bold">房號</th>
                  <th class="font-weight-bold">適用體型 (房型)</th>
                  <th class="font-weight-bold">每日價格 (TWD)</th>
                  <th class="font-weight-bold text-center" style="width: 120px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="rooms.length === 0">
                  <td colspan="4" class="text-center py-6 text-grey-darken-1 font-weight-bold">
                    📭 目前無房間資料，請新增房間。
                  </td>
                </tr>
                <tr v-for="room in rooms" :key="room.id">
                  <td class="font-weight-bold text-brown-darken-2">{{ room.room_number }}</td>
                  <td>
                    <v-chip :color="getSizeColor(room.room_type)" size="small" class="font-weight-bold text-white">
                      {{ translateSize(room.room_type) }}
                    </v-chip>
                  </td>
                  <td class="font-weight-bold text-orange-darken-3">${{ room.daily_rate }} / 晚</td>
                  <td class="text-center">
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      color="red"
                      size="small"
                      @click="handleDeleteRoom(room)"
                      title="刪除房間"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- 美容師管理窗格 -->
      <v-window-item value="groomers">
        <v-card rounded="xl" elevation="3" class="border" style="border-color: #D7CCC8 !important; overflow: hidden;">
          <v-card-title class="bg-brown-lighten-4 text-brown-darken-4 font-weight-bold py-4 px-6 d-flex align-center">
            <v-icon icon="mdi-content-cut" class="mr-2" color="brown-darken-3"></v-icon>
            專業美容師名單
            <v-btn
              color="brown-darken-2"
              prepend-icon="mdi-plus"
              rounded="pill"
              class="ml-auto font-weight-bold text-white"
              @click="openGroomerDialog"
            >
              新增美容師
            </v-btn>
          </v-card-title>

          <v-card-text class="pt-6">
            <v-table hover>
              <thead>
                <tr class="bg-grey-lighten-4 text-brown-darken-3">
                  <th class="font-weight-bold">美容師姓名</th>
                  <th class="font-weight-bold">專業特長</th>
                  <th class="font-weight-bold">年資 (年)</th>
                  <th class="font-weight-bold">評價分數</th>
                  <th class="font-weight-bold">服務次數</th>
                  <th class="font-weight-bold">服務費用 (TWD)</th>
                  <th class="font-weight-bold text-center" style="width: 120px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="groomers.length === 0">
                  <td colspan="7" class="text-center py-6 text-grey-darken-1 font-weight-bold">
                    📭 目前無美容師資料，請新增美容師。
                  </td>
                </tr>
                <tr v-for="groomer in groomers" :key="groomer.id">
                  <td class="font-weight-bold text-brown-darken-2">{{ groomer.name }}</td>
                  <td>{{ groomer.specialty || '一般洗沐剪毛' }}</td>
                  <td>{{ groomer.experience_years }} 年</td>
                  <td>
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-star" color="amber" size="small" class="mr-1"></v-icon>
                      <span class="font-weight-bold">{{ Number(groomer.rating).toFixed(1) }}</span>
                    </div>
                  </td>
                  <td>{{ groomer.service_count }} 次</td>
                  <td class="font-weight-bold text-orange-darken-3">${{ groomer.service_rate }} / 次</td>
                  <td class="text-center">
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      color="red"
                      size="small"
                      @click="handleDeleteGroomer(groomer)"
                      title="刪除美容師"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <!-- 新增房間對話框 -->
    <v-dialog v-model="roomDialog" max-width="500px" persistent>
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="font-weight-bold text-brown-darken-4 pb-2">
          <v-icon icon="mdi-bed-outline" color="orange-darken-2" class="mr-2"></v-icon>
          新增住宿房間
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitRoom" ref="roomFormRef">
            <v-text-field
              v-model="roomForm.room_number"
              label="房號 (例如 S03, M03, L02)"
              variant="outlined"
              color="orange-darken-2"
              rounded="lg"
              class="mb-3"
              :rules="[v => !!v || '房號必填']"
              required
            ></v-text-field>

            <v-select
              v-model="roomForm.room_type"
              :items="roomTypes"
              item-title="title"
              item-value="value"
              label="適用體型 (房型規格)"
              variant="outlined"
              color="orange-darken-2"
              rounded="lg"
              class="mb-3"
              :rules="[v => !!v || '房型規格必選']"
              required
            ></v-select>

            <v-text-field
              v-model.number="roomForm.daily_rate"
              label="每日住宿價格 (TWD)"
              type="number"
              variant="outlined"
              color="orange-darken-2"
              rounded="lg"
              class="mb-4"
              prefix="$"
              :rules="[v => v !== null && v >= 0 || '每日價格必須為大於等於 0 的數字']"
              required
            ></v-text-field>

            <div class="d-flex justify-end">
              <v-btn variant="text" rounded="pill" color="grey-darken-1" class="font-weight-bold mr-2" @click="roomDialog = false">
                取消
              </v-btn>
              <v-btn type="submit" color="orange-darken-2" rounded="pill" class="font-weight-bold px-6 text-white" :loading="dialogLoading">
                確認新增
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 新增美容師對話框 -->
    <v-dialog v-model="groomerDialog" max-width="500px" persistent>
      <v-card rounded="xl" class="pa-4">
        <v-card-title class="font-weight-bold text-brown-darken-4 pb-2">
          <v-icon icon="mdi-content-cut" color="brown-darken-2" class="mr-2"></v-icon>
          新增專業美容師
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitGroomer" ref="groomerFormRef">
            <v-text-field
              v-model="groomerForm.name"
              label="美容師姓名"
              variant="outlined"
              color="brown-darken-2"
              rounded="lg"
              class="mb-3"
              :rules="[v => !!v || '姓名必填']"
              required
            ></v-text-field>

            <v-text-field
              v-model="groomerForm.specialty"
              label="專業特長 (選填)"
              variant="outlined"
              color="brown-darken-2"
              rounded="lg"
              class="mb-3"
              placeholder="例如：貓咪照護、特殊造型、大型犬安撫"
            ></v-text-field>

            <v-row class="mb-1">
              <v-col cols="6">
                <v-text-field
                  v-model.number="groomerForm.experience_years"
                  label="年資 (年)"
                  type="number"
                  variant="outlined"
                  color="brown-darken-2"
                  rounded="lg"
                  :rules="[v => v !== null && v >= 0 || '年資必須大於等於 0']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="groomerForm.rating"
                  label="初始評分 (0.0 ~ 5.0)"
                  type="number"
                  step="0.1"
                  variant="outlined"
                  color="brown-darken-2"
                  rounded="lg"
                  :rules="[v => v !== null && v >= 0 && v <= 5.0 || '評分需介於 0 至 5']"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row class="mb-2">
              <v-col cols="6">
                <v-text-field
                  v-model.number="groomerForm.service_count"
                  label="服務次數 (次)"
                  type="number"
                  variant="outlined"
                  color="brown-darken-2"
                  rounded="lg"
                  :rules="[v => v !== null && v >= 0 || '次數必須大於等於 0']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="groomerForm.service_rate"
                  label="服務費用 (TWD)"
                  type="number"
                  variant="outlined"
                  color="brown-darken-2"
                  rounded="lg"
                  prefix="$"
                  :rules="[v => v !== null && v >= 0 || '服務費用必填']"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <div class="d-flex justify-end">
              <v-btn variant="text" rounded="pill" color="grey-darken-1" class="font-weight-bold mr-2" @click="groomerDialog = false">
                取消
              </v-btn>
              <v-btn type="submit" color="brown-darken-2" rounded="pill" class="font-weight-bold px-6 text-white" :loading="dialogLoading">
                確認新增
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 二次確認框 -->
    <ConfirmDialog ref="confirmDialogRef" />

    <!-- 訊息提示通知 -->
    <v-snackbar v-model="toast.show" :color="toast.color" timeout="3000" location="top">
      {{ toast.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import apiClient from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const activeTab = ref('rooms');

// 資料狀態
const rooms = ref<any[]>([]);
const groomers = ref<any[]>([]);

// 對話框控制
const roomDialog = ref(false);
const groomerDialog = ref(false);
const dialogLoading = ref(false);
const roomFormRef = ref<any>(null);
const groomerFormRef = ref<any>(null);
const confirmDialogRef = ref<any>(null);

// Toast 提示
const toast = reactive({
  show: false,
  message: '',
  color: 'success'
});

const showToast = (message: string, color = 'success') => {
  toast.message = message;
  toast.color = color;
  toast.show = true;
};

// 房型常數與翻譯
const roomTypes = [
  { title: '小型房 (Small)', value: 'Small' },
  { title: '中型房 (Medium)', value: 'Medium' },
  { title: '大型房 (Large)', value: 'Large' }
];

const translateSize = (size: string) => {
  const map: Record<string, string> = {
    Small: '小型 (Small)',
    Medium: '中型 (Medium)',
    Large: '大型 (Large)'
  };
  return map[size] || size;
};

const getSizeColor = (size: string) => {
  const map: Record<string, string> = {
    Small: 'teal-darken-1',
    Medium: 'orange-darken-1',
    Large: 'deep-orange-darken-2'
  };
  return map[size] || 'grey';
};

// 表單初始值
const roomForm = reactive({
  room_number: '',
  room_type: 'Small',
  daily_rate: 400
});

const groomerForm = reactive({
  name: '',
  specialty: '',
  experience_years: 1,
  rating: 5.0,
  service_count: 0,
  service_rate: 500
});

// 拉取房間與美容師列表
const fetchResources = async () => {
  try {
    const roomRes = await apiClient.get('/resources/rooms');
    rooms.value = roomRes.data;
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
  }

  try {
    const groomerRes = await apiClient.get('/resources/groomers');
    groomers.value = groomerRes.data;
  } catch (error) {
    console.error('Failed to fetch groomers:', error);
  }
};

onMounted(() => {
  fetchResources();
});

// 新增房間
const openRoomDialog = () => {
  roomForm.room_number = '';
  roomForm.room_type = 'Small';
  roomForm.daily_rate = 400;
  roomDialog.value = true;
};

const submitRoom = async () => {
  const validateRes = await roomFormRef.value?.validate();
  if (!validateRes || !validateRes.valid) return;

  dialogLoading.value = true;
  try {
    await apiClient.post('/resources/rooms', roomForm);
    showToast('房間新增成功！');
    roomDialog.value = false;
    fetchResources();
  } catch (error: any) {
    const msg = error.response?.data?.error || '新增房間失敗';
    showToast(msg, 'error');
  } finally {
    dialogLoading.value = false;
  }
};

// 新增美容師
const openGroomerDialog = () => {
  groomerForm.name = '';
  groomerForm.specialty = '';
  groomerForm.experience_years = 1;
  groomerForm.rating = 5.0;
  groomerForm.service_count = 0;
  groomerForm.service_rate = 500;
  groomerDialog.value = true;
};

const submitGroomer = async () => {
  const validateRes = await groomerFormRef.value?.validate();
  if (!validateRes || !validateRes.valid) return;

  dialogLoading.value = true;
  try {
    await apiClient.post('/resources/groomers', groomerForm);
    showToast('美容師新增成功！');
    groomerDialog.value = false;
    fetchResources();
  } catch (error: any) {
    const msg = error.response?.data?.error || '新增美容師失敗';
    showToast(msg, 'error');
  } finally {
    dialogLoading.value = false;
  }
};

// 刪除房間
const handleDeleteRoom = async (room: any) => {
  const isConfirmed = await confirmDialogRef.value?.open({
    title: '⚠️ 確定刪除房間？',
    message: `您確定要刪除房間 ${room.room_number} 嗎？刪除後將無法還原此房間資料！`,
    confirmText: '確定刪除',
    cancelText: '取消',
    confirmColor: 'red'
  });

  if (!isConfirmed) return;

  try {
    await apiClient.delete(`/resources/rooms/${room.id}`);
    showToast('房間刪除成功！');
    fetchResources();
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data?.error || '刪除失敗，該房間可能有進行中或未來的預約安排！';
    showToast(msg, 'error');
  }
};

// 刪除美容師
const handleDeleteGroomer = async (groomer: any) => {
  const isConfirmed = await confirmDialogRef.value?.open({
    title: '⚠️ 確定刪除美容師？',
    message: `您確定要刪除美容師 ${groomer.name} 嗎？刪除後將無法還原此美容師資料！`,
    confirmText: '確定刪除',
    cancelText: '取消',
    confirmColor: 'red'
  });

  if (!isConfirmed) return;

  try {
    await apiClient.delete(`/resources/groomers/${groomer.id}`);
    showToast('美容師刪除成功！');
    fetchResources();
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data?.error || '刪除失敗，該美容師可能在未來有預約指派！';
    showToast(msg, 'error');
  }
};
</script>

<style scoped>
/* 保持 Vuetify 質感 */
</style>
