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
                class="font-weight-bold px-6 text-white"
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
                    label="登入帳號"
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
                class="font-weight-bold px-6 text-white"
                :loading="staffLoading"
              >
                建立帳號
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 2.5. 活動員工帳號管理與排班設定 (Admin專屬) -->
      <v-col cols="12">
        <v-card rounded="xl" elevation="3" class="border" style="border-color: #A5D6A7 !important; overflow: hidden;">
          <v-card-title class="bg-green-lighten-4 text-green-darken-4 font-weight-bold py-3 d-flex justify-space-between align-center">
            <div>
              <v-icon icon="mdi-account-cog-outline" class="mr-2" color="green-darken-3"></v-icon>
              活動員工帳號管理與排班設定
            </div>
            <v-btn icon="mdi-refresh" variant="text" size="small" @click="fetchEmployees" :loading="employeesLoading"></v-btn>
          </v-card-title>
          
          <v-data-table
            :headers="employeeHeaders"
            :items="employees"
            class="elevation-0"
            height="300px"
            fixed-header
            :loading="employeesLoading"
          >
            <template v-slot:item.role="{ item }">
              <v-chip :color="(item as any).role === 'Admin' ? 'red-darken-2' : 'orange-darken-2'" size="small" class="font-weight-bold text-white">
                {{ (item as any).role === 'Admin' ? '👑 管理員/老闆' : '💼 服務夥伴' }}
              </v-chip>
            </template>
            <template v-slot:item.is_active="{ item }">
              <v-switch
                v-model="(item as any).is_active"
                :true-value="1"
                :false-value="0"
                color="success"
                density="compact"
                hide-details
                @change="toggleActive(item)"
                class="d-inline-flex"
                :disabled="currentUser?.id === (item as any).id"
              ></v-switch>
            </template>
            <template v-slot:item.is_reservable="{ item }">
              <v-switch
                v-model="(item as any).is_reservable"
                :true-value="1"
                :false-value="0"
                color="success"
                density="compact"
                hide-details
                @change="toggleReservable(item)"
                class="d-inline-flex"
              ></v-switch>
            </template>
            <template v-slot:item.created_at="{ item }">
              {{ new Date((item as any).created_at).toLocaleString() }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                v-if="(item as any).role !== 'Admin'"
                color="green-darken-2"
                variant="flat"
                size="x-small"
                rounded="pill"
                class="font-weight-bold text-white px-3"
                @click="viewEmployeeTasks(item)"
              >
                🔍 查看任務
              </v-btn>
              <span v-else class="text-caption text-grey">管理員免排程</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- 員工任務詳細對話框 -->
      <v-dialog v-model="tasksDialog" max-width="680px" persistent>
        <v-card rounded="xl" class="pa-4 border">
          <v-card-title class="font-weight-bold text-brown-darken-4 d-flex align-center pb-2 border-b">
            <v-icon icon="mdi-calendar-check" color="green-darken-2" class="mr-2"></v-icon>
            【{{ selectedEmployee?.name }}】的任務與工作明細
          </v-card-title>
          
          <v-card-text class="pt-4">
            <v-data-table
              :headers="taskHeaders"
              :items="employeeTasks"
              :loading="tasksLoading"
              class="bg-transparent"
              no-data-text="該員工目前無被指派的照護或美容任務"
            >
              <template v-slot:item.start_time="{ item }">
                <span class="text-caption">
                  {{ new Date((item as any).start_time).toLocaleString([], {month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit'}) }}
                </span>
              </template>
              <template v-slot:item.end_time="{ item }">
                <span class="text-caption">
                  {{ new Date((item as any).end_time).toLocaleString([], {month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit'}) }}
                </span>
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip :color="(item as any).status === 'Pending' ? 'warning' : ((item as any).status === 'Confirmed' ? 'success' : ((item as any).status === 'Completed' ? 'grey' : 'error'))" size="x-small" class="font-weight-bold text-white">
                  {{ (item as any).status === 'Pending' ? '待確認' : ((item as any).status === 'Confirmed' ? '已確認' : ((item as any).status === 'Completed' ? '已完成' : '已取消')) }}
                </v-chip>
              </template>
              <template v-slot:item.care_checklist="{ item }">
                <div class="d-flex flex-wrap gap-1" style="gap: 4px;">
                  <v-chip v-if="(item as any).needs_feeding" :color="(item as any).fed_completed ? 'success' : 'grey-lighten-1'" size="x-small" variant="flat" class="text-white font-weight-bold">
                    {{ (item as any).fed_completed ? '✅ 餵食' : '🍽️ 餵食' }}
                  </v-chip>
                  <v-chip v-if="(item as any).needs_walking" :color="(item as any).walk_completed ? 'success' : 'grey-lighten-1'" size="x-small" variant="flat" class="text-white font-weight-bold">
                    {{ (item as any).walk_completed ? '✅ 散步' : '👣 散步' }}
                  </v-chip>
                  <v-chip v-if="(item as any).needs_medication" :color="(item as any).medication_completed ? 'success' : 'grey-lighten-1'" size="x-small" variant="flat" class="text-white font-weight-bold">
                    {{ (item as any).medication_completed ? '✅ 給藥' : '💊 給藥' }}
                  </v-chip>
                  <v-chip v-if="(item as any).needs_grooming" :color="(item as any).grooming_completed ? 'success' : 'grey-lighten-1'" size="x-small" variant="flat" class="text-white font-weight-bold">
                    {{ (item as any).grooming_completed ? '✅ 美容' : '✂️ 美容' }}
                  </v-chip>
                  <span v-if="!(item as any).needs_feeding && !(item as any).needs_walking && !(item as any).needs_medication && !(item as any).needs_grooming" class="text-caption text-grey">無照護服務</span>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
          
          <v-card-actions class="pb-4 px-4 pt-2 border-t">
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" rounded="pill" class="font-weight-bold" @click="tasksDialog = false">關閉視窗</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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
              <v-chip :color="getActionColor((item as any).action)" size="small" class="font-weight-bold text-white">
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
import { ref, reactive, onMounted, computed } from 'vue';
import apiClient from '../api/client';

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

const employeeHeaders = [
  { title: '員工 ID', key: 'id' },
  { title: '登入帳號', key: 'username' },
  { title: '姓名', key: 'name' },
  { title: '權限等級', key: 'role' },
  { title: '帳號啟用狀態', key: 'is_active', sortable: false },
  { title: '排班預約啟用', key: 'is_reservable', sortable: false },
  { title: '建立時間', key: 'created_at' },
  { title: '操作', key: 'actions', sortable: false }
];

const taskHeaders = [
  { title: '預約單 ID', key: 'id' },
  { title: '入住毛孩', key: 'pet_name' },
  { title: '房號', key: 'room_number' },
  { title: '入住時間', key: 'start_time' },
  { title: '退房時間', key: 'end_time' },
  { title: '狀態', key: 'status' },
  { title: '照護服務進度', key: 'care_checklist', sortable: false }
];

const employees = ref<any[]>([]);
const employeesLoading = ref(false);

const currentUser = computed(() => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
});

const fetchEmployees = async () => {
  employeesLoading.value = true;
  try {
    const res = await apiClient.get('/auth/employees');
    employees.value = res.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
  } finally {
    employeesLoading.value = false;
  }
};

const toggleReservable = async (item: any) => {
  try {
    await apiClient.patch(`/auth/employees/${item.id}/reservable`, {
      is_reservable: item.is_reservable
    });
    snackbar.message = `已更動【${item.name}】的排班狀態為 ${item.is_reservable ? '啟用' : '停用'}！`;
    snackbar.color = 'success';
    snackbar.show = true;
    fetchAuditLogs();
  } catch (error) {
    console.error('Error toggling reservable:', error);
    snackbar.message = '變更排班狀態失敗';
    snackbar.color = 'error';
    snackbar.show = true;
    item.is_reservable = item.is_reservable === 1 ? 0 : 1;
  }
};

const toggleActive = async (item: any) => {
  try {
    await apiClient.patch(`/auth/employees/${item.id}/active`, {
      is_active: item.is_active
    });
    snackbar.message = `已更動【${item.name}】的啟用狀態為 ${item.is_active ? '啟用' : '停用'}！`;
    snackbar.color = 'success';
    snackbar.show = true;
    fetchAuditLogs();
  } catch (error: any) {
    console.error('Error toggling active status:', error);
    const msg = error.response?.data?.error || '變更帳號啟用狀態失敗';
    snackbar.message = msg;
    snackbar.color = 'error';
    snackbar.show = true;
    item.is_active = item.is_active === 1 ? 0 : 1;
  }
};

// 查看任務 Dialog
const tasksDialog = ref(false);
const selectedEmployee = ref<any>(null);
const employeeTasks = ref<any[]>([]);
const tasksLoading = ref(false);

const viewEmployeeTasks = async (employee: any) => {
  selectedEmployee.value = employee;
  tasksDialog.value = true;
  tasksLoading.value = true;
  try {
    const res = await apiClient.get(`/auth/employees/${employee.id}/tasks`);
    employeeTasks.value = res.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
  } finally {
    tasksLoading.value = false;
  }
};

const fetchSettings = async () => {
  try {
    const res = await apiClient.get('/settings');
    settings.business_start_time = res.data.business_start_time || '09:00';
    settings.business_end_time = res.data.business_end_time || '21:00';
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
};

const saveSettings = async () => {
  settingsLoading.value = true;
  try {
    await apiClient.put('/settings', settings);
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
    await apiClient.post('/auth/register-staff', newStaff);
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
    fetchEmployees();
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
    const res = await apiClient.get('/settings/logs');
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
    CREATE_PET_WITH_OWNER: 'indigo',
    UPDATE_PET_WITH_OWNER: 'amber-darken-2',
    CHANGE_PASSWORD: 'brown',
    CREATE_ROOM: 'teal-darken-3',
    DELETE_ROOM: 'red-darken-3',
    CREATE_GROOMER: 'light-green-darken-2',
    DELETE_GROOMER: 'red-darken-4',
    TOGGLE_EMPLOYEE_ACTIVE: 'pink-darken-3',
    CREATE_FEEDING_TASK: 'deep-orange',
    UPDATE_FEEDING_TASK: 'brown-darken-1'
  };
  return map[action] || 'grey';
};

onMounted(() => {
  fetchSettings();
  fetchAuditLogs();
  fetchEmployees();
});
</script>

<style scoped>
</style>
