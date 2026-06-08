<template>
  <v-container>
    <div class="text-h5 font-weight-bold mb-6" style="color: #6D4C41;">
      <v-icon icon="mdi-cog-outline" color="brown-lighten-1" class="mr-2"></v-icon>
      系統安全與營業設定 (管理員專屬)
    </div>

    <v-row>
      <!-- 1. 營業時間設定 -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="3" class="border h-100" style="border-color: #FFCC80 !important; overflow: hidden;">
          <v-card-title class="bg-orange-lighten-4 text-brown-darken-4 font-weight-bold py-3">
            <v-icon icon="mdi-clock-outline" class="mr-2" color="orange-darken-3"></v-icon>
            營業時間調整
          </v-card-title>
          <v-card-text class="pt-6">
            <v-form @submit.prevent="saveSettings">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="settings.business_start_time"
                    label="開始營業時間"
                    type="time"
                    variant="outlined"
                    color="orange-darken-2"
                    rounded="lg"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="settings.business_end_time"
                    label="結束營業時間"
                    type="time"
                    variant="outlined"
                    color="orange-darken-2"
                    rounded="lg"
                    required
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn
                type="submit"
                color="orange-darken-2"
                rounded="pill"
                class="font-weight-bold px-6"
                :loading="settingsLoading"
              >
                儲存時間設定
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 2. 新增員工帳號 -->
      <v-col cols="12" md="6">
        <v-card rounded="xl" elevation="3" class="border h-100" style="border-color: #D7CCC8 !important; overflow: hidden;">
          <v-card-title class="bg-brown-lighten-4 text-brown-darken-4 font-weight-bold py-3">
            <v-icon icon="mdi-account-plus-outline" class="mr-2" color="brown-darken-3"></v-icon>
            建立員工帳號
          </v-card-title>
          <v-card-text class="pt-6">
            <v-form @submit.prevent="registerEmployee" ref="registerForm">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newStaff.username"
                    label="登入帳號 (身分證號/信箱)"
                    variant="outlined"
                    color="brown-darken-2"
                    rounded="lg"
                    :rules="[v => !!v || '此欄位必填']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newStaff.name"
                    label="員工姓名"
                    variant="outlined"
                    color="brown-darken-2"
                    rounded="lg"
                    :rules="[v => !!v || '此欄位必填']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="newStaff.password"
                    label="預設登入密碼"
                    type="password"
                    variant="outlined"
                    color="brown-darken-2"
                    rounded="lg"
                    :rules="[v => !!v || '此欄位必填']"
                    required
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="newStaff.role"
                    label="權限等級"
                    :items="['Staff', 'Admin']"
                    variant="outlined"
                    color="brown-darken-2"
                    rounded="lg"
                    required
                  ></v-select>
                </v-col>
              </v-row>
              <v-btn
                type="submit"
                color="brown-darken-2"
                rounded="pill"
                class="font-weight-bold px-6"
                :loading="staffLoading"
              >
                建立帳號
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 3. 操作歷史日誌看板 -->
      <v-col cols="12">
        <v-card rounded="xl" elevation="3" class="border" style="border-color: #B0BEC5 !important; overflow: hidden;">
          <v-card-title class="bg-blue-grey-lighten-4 text-blue-grey-darken-4 font-weight-bold py-3 d-flex justify-space-between align-center">
            <div>
              <v-icon icon="mdi-history" class="mr-2" color="blue-grey-darken-3"></v-icon>
              系統安全操作日誌 (Audit Logs)
            </div>
            <v-btn icon="mdi-refresh" variant="text" size="small" @click="fetchAuditLogs" :loading="logsLoading"></v-btn>
          </v-card-title>
          
          <v-data-table
            :headers="logHeaders"
            :items="auditLogs"
            class="elevation-0"
            height="300px"
            fixed-header
            :loading="logsLoading"
          >
            <template v-slot:item.action="{ item }">
              <v-chip :color="getActionColor((item as any).action)" size="small" class="font-weight-bold">
                {{ (item as any).action }}
              </v-chip>
            </template>
            <template v-slot:item.created_at="{ item }">
              {{ new Date((item as any).created_at).toLocaleString() }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- 提示框 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const settingsLoading = ref(false);
const staffLoading = ref(false);
const logsLoading = ref(false);

const settings = reactive({
  business_start_time: '09:00',
  business_end_time: '21:00'
});

const newStaff = reactive({
  username: '',
  password: '',
  name: '',
  role: 'Staff' as 'Staff' | 'Admin'
});

const auditLogs = ref([]);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const logHeaders = [
  { title: '日誌 ID', key: 'id' },
  { title: '操作時間', key: 'created_at' },
  { title: '操作人員', key: 'employee_name' },
  { title: '動作', key: 'action' },
  { title: '詳細資訊內容', key: 'details', sortable: false },
];

const fetchSettings = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/settings');
    settings.business_start_time = res.data.business_start_time || '09:00';
    settings.business_end_time = res.data.business_end_time || '21:00';
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
};

const saveSettings = async () => {
  settingsLoading.value = true;
  try {
    await axios.put('http://localhost:3000/api/settings', settings);
    snackbar.message = '營業時間設定儲存成功！';
    snackbar.color = 'success';
    snackbar.show = true;
    fetchAuditLogs();
  } catch (error: any) {
    console.error('Error saving settings:', error);
    snackbar.message = error.response?.data?.error || '儲存設定失敗';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    settingsLoading.value = false;
  }
};

const registerForm = ref<any>(null);
const registerEmployee = async () => {
  if (!newStaff.username || !newStaff.password || !newStaff.name) return;

  staffLoading.value = true;
  try {
    await axios.post('http://localhost:3000/api/auth/register-staff', newStaff);
    snackbar.message = `成功建立員工【${newStaff.name}】的帳號！`;
    snackbar.color = 'success';
    snackbar.show = true;
    
    // 清空表單
    newStaff.username = '';
    newStaff.password = '';
    newStaff.name = '';
    newStaff.role = 'Staff';
    if (registerForm.value) registerForm.value.resetValidation();
    
    fetchAuditLogs();
  } catch (error: any) {
    console.error('Error registering employee:', error);
    snackbar.message = error.response?.data?.error || '帳號建立失敗';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    staffLoading.value = false;
  }
};

const fetchAuditLogs = async () => {
  logsLoading.value = true;
  try {
    const res = await axios.get('http://localhost:3000/api/settings/logs');
    auditLogs.value = res.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
  } finally {
    logsLoading.value = false;
  }
};

const getActionColor = (action: string) => {
  const map: Record<string, string> = {
    LOGIN: 'blue',
    CREATE_RESERVATION: 'green-darken-1',
    UPDATE_RESERVATION_STATUS: 'cyan-darken-1',
    UPDATE_FEEDING_STATUS: 'teal',
    UPDATE_SETTINGS: 'orange-darken-2',
    REGISTER_STAFF: 'purple',
    CREATE_PET_WITH_OWNER: 'indigo'
  };
  return map[action] || 'grey';
};

onMounted(() => {
  fetchSettings();
  fetchAuditLogs();
});
</script>
