<template>
  <v-container class="pa-0">
    <v-stepper v-model="step" rounded="xl" elevation="0" class="border-0 bg-transparent">
      <v-stepper-header class="elevation-0 bg-transparent mb-4">
        <v-stepper-item :complete="step > 1" title="選擇毛孩與時間" :value="1" color="orange-darken-2" class="font-weight-bold"></v-stepper-item>
        <v-divider color="brown-lighten-4"></v-divider>
        <v-stepper-item :complete="step > 2" title="精緻客房與美容" :value="2" color="orange-darken-2" class="font-weight-bold"></v-stepper-item>
        <v-divider color="brown-lighten-4"></v-divider>
        <v-stepper-item title="確認明細" :value="3" color="orange-darken-2" class="font-weight-bold"></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window style="background-color: transparent;">
        <!-- 步驟 1: 選擇毛孩與時間 -->
        <v-stepper-window-item :value="1">
          <!-- 初次入住提示區 -->
          <v-alert
            color="orange-lighten-5"
            border="start"
            border-color="orange-darken-2"
            elevation="1"
            class="mb-6 pa-4 rounded-xl border"
            style="border-color: #FFE0B2 !important;"
          >
            <div class="d-flex align-center justify-space-between w-100 flex-wrap">
              <div class="text-left pr-4">
                <div class="text-subtitle-1 font-weight-bold text-brown-darken-4 mb-1">
                  <v-icon icon="mdi-help-circle-outline" color="orange-darken-3" class="mr-1"></v-icon>
                  初次造訪的毛寶貝？
                </div>
                <div class="text-caption text-brown-darken-3 font-weight-medium">
                  請先為毛孩與飼主建立基本資料與健康歷史，以便系統提供最貼心的智慧排房服務。
                </div>
              </div>
              <v-btn
                color="orange-darken-2"
                variant="elevated"
                prepend-icon="mdi-account-plus-outline"
                class="font-weight-bold px-5 mt-2 mt-sm-0"
                rounded="pill"
                @click="showAddDialog = true" 
              >
                毛孩建檔
              </v-btn>
            </div>
          </v-alert>

          <!-- 時間選擇表單 -->
          <v-card flat class="bg-transparent text-left">
            <v-select
              v-model="form.pet_id"
              :items="pets"
              item-title="display_name"
              item-value="id"
              label="選擇入住的毛寶貝 *"
              variant="outlined"
              color="orange-darken-2"
              rounded="xl"
              prepend-inner-icon="mdi-dog"
              class="mb-2"
            ></v-select>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.start_datetime"
                  type="datetime-local"
                  label="預計入住時間 *"
                  variant="outlined"
                  color="orange-darken-2"
                  rounded="xl"
                  prepend-inner-icon="mdi-clock-start"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.end_datetime"
                  type="datetime-local"
                  label="預計退房時間 *"
                  variant="outlined"
                  color="orange-darken-2"
                  rounded="xl"
                  prepend-inner-icon="mdi-clock-end"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <!-- 客房已滿警示 -->
            <v-alert
              v-if="isRoomFullForPetSize"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-4 rounded-xl font-weight-bold text-body-2"
              icon="mdi-alert-octagon"
            >
              ⚠️ 目前沒有可用房間！此時段您選擇的體型客房已全滿，請調整入住時間。
            </v-alert>

            <div class="d-flex justify-end mt-4">
              <v-btn
                color="orange-darken-2"
                rounded="pill"
                class="px-8 font-weight-bold"
                size="large"
                @click="validateAndGoToStep2"
                :disabled="!form.pet_id || !form.start_datetime || !form.end_datetime || isRoomFullForPetSize"
              >
                挑選資源 ➡️
              </v-btn>
            </div>
          </v-card>
        </v-stepper-window-item>

        <!-- 步驟 2: 精緻房型與美容師挑選 (卡片式) -->
        <v-stepper-window-item :value="2">
          <v-alert type="info" variant="tonal" density="compact" class="mb-6 rounded-lg text-left" icon="mdi-auto-fix" color="orange-darken-3">
            系統已根據您的毛孩體型自動推薦合適房型，您也可以點擊其他卡片進行更改。
          </v-alert>

          <!-- 1. 精緻房型卡片選擇區 -->
          <div class="text-left mb-6">
            <div class="text-subtitle-1 font-weight-bold text-brown-darken-4 mb-3">
              🏠 選擇套房規格 (住宿)
            </div>
            <v-row>
              <v-col cols="12" sm="6" md="4" v-for="room in rooms" :key="room.id">
                <v-card
                  :color="form.room_id === room.id ? (hasRoomConflict ? 'red-lighten-5' : 'orange-lighten-5') : (occupiedRoomIds.includes(room.id) ? 'grey-lighten-4' : 'white')"
                  :class="[
                    'border h-100 room-card d-flex flex-column', 
                    form.room_id === room.id ? (hasRoomConflict ? 'conflict-border pulsing-red-border' : 'selected-card shadow-lg') : '',
                    occupiedRoomIds.includes(room.id) ? 'opacity-60 cursor-not-allowed' : ''
                  ]"
                  @click="!occupiedRoomIds.includes(room.id) && (form.room_id = room.id)"
                  rounded="xl"
                  elevation="1"
                  :disabled="occupiedRoomIds.includes(room.id)"
                  style="transition: all 0.3s;"
                >
                  <v-img
                    src="/luxury_pet_room.png"
                    height="120"
                    cover
                    class="bg-grey-lighten-3"
                    :style="occupiedRoomIds.includes(room.id) ? 'filter: grayscale(1); opacity: 0.5;' : ''"
                  ></v-img>
                  
                  <v-card-item class="pt-3 pb-1 flex-grow-1">
                    <v-card-title class="font-weight-bold text-brown-darken-4 text-body-1 d-flex justify-space-between align-center">
                      {{ translateSize(room.room_type) }}
                      <v-icon :icon="room.icon" :color="occupiedRoomIds.includes(room.id) ? 'grey' : room.color" size="small"></v-icon>
                    </v-card-title>
                    <v-card-subtitle class="mt-1 text-caption font-weight-bold">
                      房號: {{ room.room_number }} · 
                      <span v-if="occupiedRoomIds.includes(room.id)" class="text-error">已預約 (不可選)</span>
                      <span v-else>${{ room.daily_rate }}/晚</span>
                    </v-card-subtitle>
                  </v-card-item>

                  <v-card-text class="text-caption text-grey-darken-2 pb-3 pt-0">
                    {{ room.desc }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 1.5. 客製照護項目勾選區 -->
          <div class="text-left mb-6">
            <div class="text-subtitle-1 font-weight-bold text-brown-darken-4 mb-3">
              🐾 規劃客製照護服務項目 (可多選)
            </div>
            <v-card rounded="xl" class="pa-4 border bg-white" style="border-color: rgba(141, 110, 99, 0.15) !important;">
              <v-row>
                <v-col cols="6" sm="3">
                  <v-checkbox
                    v-model="form.needs_feeding"
                    label="🍽️ 餵食服務"
                    color="orange-darken-2"
                    density="comfortable"
                    hide-details
                  ></v-checkbox>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-checkbox
                    v-model="form.needs_walking"
                    label="👣 散步陪伴"
                    color="blue-darken-1"
                    density="comfortable"
                    hide-details
                  ></v-checkbox>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-checkbox
                    v-model="form.needs_medication"
                    label="💊 協助給藥"
                    color="purple-darken-1"
                    density="comfortable"
                    hide-details
                  ></v-checkbox>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-checkbox
                    v-model="form.needs_grooming"
                    label="✂️ 美容洗沐"
                    color="teal-darken-1"
                    density="comfortable"
                    hide-details
                  ></v-checkbox>
                </v-col>
              </v-row>
            </v-card>
          </div>

          <!-- 2. 美容師卡片選擇區 -->
          <div class="text-left mb-6">
            <div class="text-subtitle-1 font-weight-bold text-brown-darken-4 mb-3">
              ✂️ 預約專屬美容服務 (選填)
            </div>
            <v-row>
              <v-col cols="12" sm="6" md="4" v-for="staff in staffs" :key="staff.id">
                <v-card
                  :color="form.staff_id === staff.id ? (hasStaffConflict ? 'red-lighten-5' : 'orange-lighten-5') : (occupiedGroomerIds.includes(staff.id) ? 'grey-lighten-4' : 'white')"
                  :class="[
                    'border h-100 staff-card d-flex flex-column', 
                    form.staff_id === staff.id ? (hasStaffConflict ? 'conflict-border pulsing-red-border' : 'selected-card shadow-lg') : '',
                    occupiedGroomerIds.includes(staff.id) ? 'opacity-60 cursor-not-allowed' : ''
                  ]"
                  @click="!occupiedGroomerIds.includes(staff.id) && (form.staff_id = staff.id === form.staff_id ? null : staff.id)"
                  rounded="xl"
                  elevation="1"
                  :disabled="occupiedGroomerIds.includes(staff.id)"
                  style="transition: all 0.3s;"
                >
                  <v-card-item class="pt-4 pb-2">
                    <div class="d-flex align-center">
                      <v-avatar :color="occupiedGroomerIds.includes(staff.id) ? 'grey' : staff.color" size="40" class="text-white mr-3 elevation-1">
                        <v-icon :icon="staff.icon"></v-icon>
                      </v-avatar>
                      <div class="text-left">
                        <v-card-title class="font-weight-bold text-brown-darken-4 pa-0 text-body-2 d-flex align-center">
                          {{ staff.name }}
                          <v-chip v-if="occupiedGroomerIds.includes(staff.id)" size="x-small" color="red" class="ml-2 font-weight-bold text-white" variant="flat">已預約 (不可選)</v-chip>
                        </v-card-title>
                        <div class="d-flex align-center mt-1">
                          <v-rating
                            :model-value="staff.rating"
                            readonly
                            density="compact"
                            size="x-small"
                            color="amber-accent-4"
                            half-increments
                          ></v-rating>
                          <span class="text-caption text-grey-darken-1 ml-1" style="font-size: 10px !important;">★ {{ staff.rating }} ({{ staff.service_count }} 次服務)</span>
                        </div>
                      </div>
                    </div>
                  </v-card-item>

                  <v-card-text class="text-caption text-grey-darken-2 pb-4 pt-1 flex-grow-1">
                    <strong>專長：</strong>{{ staff.specialty }}<br>
                    <span class="text-caption text-grey-darken-1">📖 資歷 {{ staff.experience }} · <span v-if="occupiedGroomerIds.includes(staff.id)" class="text-error font-weight-bold">目前已被佔用</span><span v-else>收費: ${{ staff.service_rate }}</span></span>
                    <div class="mt-2 d-flex flex-wrap gap-1" v-if="staff.credentials && staff.credentials.length > 0">
                      <v-chip 
                        v-for="cred in staff.credentials" 
                        :key="cred" 
                        size="x-small" 
                        :color="occupiedGroomerIds.includes(staff.id) ? 'grey' : 'teal-darken-1'" 
                        variant="tonal"
                        class="font-weight-bold"
                      >{{ cred }}</v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 衝突警示 Banner -->
          <v-alert
            v-if="hasRoomConflict"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4 rounded-xl font-weight-bold text-body-2 text-left"
            icon="mdi-alert-octagon"
          >
            ⚠️ 衝突阻擋：{{ getDetailedRoomConflictInfo }}
          </v-alert>

          <v-alert
            v-if="hasStaffConflict"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-2 rounded-xl font-weight-bold text-body-2 text-left"
            icon="mdi-alert-octagon"
          >
            ⚠️ 衝突阻擋：{{ getDetailedStaffConflictInfo }}
          </v-alert>

          <!-- 上一步與下一步 -->
          <div class="d-flex justify-space-between mt-6">
            <v-btn variant="text" rounded="pill" class="font-weight-bold text-brown-lighten-1" @click="step = 1">⬅️ 返回時間</v-btn>
            <v-btn 
              color="orange-darken-2" 
              rounded="pill" 
              class="px-8 font-weight-bold text-white" 
              @click="step = 3"
              :disabled="hasRoomConflict || hasStaffConflict"
            >
              下一步 ➡️
            </v-btn>
          </div>
        </v-stepper-window-item>

        <!-- 步驟 3: 確認明細並送出 -->
        <v-stepper-window-item :value="3">
          <v-card flat class="bg-transparent text-left max-width-600 mx-auto">
            <v-card class="pa-6 rounded-xl border mb-6" elevation="1" style="border-color: #D7CCC8 !important; background-color: #FFFDF9;">
              <div class="text-h6 font-weight-bold text-brown-darken-4 mb-4 pb-2 border-b">
                📋 預約細目確認
              </div>
              <v-row class="text-body-1">
                <v-col cols="12" class="py-1">
                  🐾 <strong>入住毛孩：</strong> <span class="text-brown-darken-3 font-weight-bold">{{ getSelectedPetName() }}</span>
                </v-col>
                <v-col cols="12" class="py-1">
                  📅 <strong>入住時間：</strong> {{ form.start_datetime?.replace('T', ' ') }}
                </v-col>
                <v-col cols="12" class="py-1">
                  🚪 <strong>退房時間：</strong> {{ form.end_datetime?.replace('T', ' ') }}
                </v-col>
                <v-col cols="12" class="py-1">
                  🏠 <strong>房型規格：</strong> <span class="text-orange-darken-3 font-weight-bold">{{ getSelectedRoomName() }}</span>
                </v-col>
                <v-col cols="12" class="py-1">
                  💇 <strong>美容規劃：</strong> <span class="text-green-darken-3 font-weight-bold">{{ getSelectedStaffName() }}</span>
                </v-col>
                <v-col cols="12" class="py-1">
                  🐾 <strong>客製照護：</strong> <span class="text-brown-darken-3 font-weight-bold">{{ getSelectedCareServices() }}</span>
                </v-col>
              </v-row>
            </v-card>

            <div class="d-flex justify-space-between">
              <v-btn variant="text" rounded="pill" class="font-weight-bold text-brown-lighten-1" @click="step = 2">⬅️ 重選資源</v-btn>
              <v-btn
                color="green-darken-2"
                rounded="pill"
                class="px-8 font-weight-bold text-white"
                elevation="3"
                size="large"
                :loading="loading"
                @click="submitReservation"
              >
                ✨ 確認無誤，送出預約
              </v-btn>
            </div>
          </v-card>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <!-- 新增顧客與寵物 Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" persistent>
      <v-card rounded="xl" class="border">
        <v-card-title class="bg-orange-lighten-4 text-brown-darken-4 font-weight-bold py-4 px-6 d-flex align-center">
          <v-icon icon="mdi-card-account-details-outline" class="mr-2" color="orange-darken-3"></v-icon>
          建立毛孩與主人檔案
        </v-card-title>
        <v-card-text class="pt-6 px-6">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="newPetForm.owner_name" label="飼主姓名" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-account" hide-details></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="newPetForm.phone" label="聯絡電話" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-phone" placeholder="例如: 0912345678" hide-details></v-text-field>
            </v-col>
          </v-row>
          <v-divider class="my-4" color="brown-lighten-3"></v-divider>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field v-model="newPetForm.pet_name" label="寵物名字" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-dog" hide-details></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="newPetForm.species"
                :items="[{title: '🐶 狗 (Dog)', value: 'Dog'}, {title: '🐱 貓 (Cat)', value: 'Cat'}]"
                item-title="title"
                item-value="value"
                label="寵物物種"
                variant="outlined"
                color="orange-darken-2"
                prepend-inner-icon="mdi-cat"
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="newPetForm.size" :items="['Small', 'Medium', 'Large']" label="寵物體型" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-scale-balance" hide-details></v-select>
            </v-col>
          </v-row>
          <v-textarea v-model="newPetForm.medical_history" label="醫療史與過敏症狀 (選填)" variant="outlined" color="red-darken-2" prepend-inner-icon="mdi-medical-bag" rows="2" auto-grow placeholder="例如：對海鮮過敏、有心臟病..." class="mt-4" hide-details></v-textarea>
          <v-textarea v-model="newPetForm.notes" label="特別照護交代 (選填)" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-note-edit-outline" rows="2" auto-grow placeholder="例如：很怕雷聲、有護食行為..." class="mt-4" hide-details></v-textarea>
        </v-card-text>
        <v-card-actions class="pb-6 px-6 pt-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" rounded="pill" class="font-weight-bold text-grey-darken-1" @click="showAddDialog = false">取消</v-btn>
          <v-btn color="orange-darken-2" variant="elevated" rounded="pill" class="px-6 font-weight-bold" :loading="isAdding" @click="submitNewPet">確認建立</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 預約提交成功跳轉 Dialog -->
    <v-dialog v-model="successDialog" max-width="480px" persistent>
      <v-card rounded="xl" class="pa-6 text-center">
        <v-card-text class="pt-4">
          <v-avatar color="success" size="64" class="mb-4 text-white elevation-2">
            <v-icon icon="mdi-check-bold" size="36"></v-icon>
          </v-avatar>
          <div class="text-h5 font-weight-bold text-brown-darken-4 mb-2">預約提交成功！</div>
          <p class="text-body-2 text-grey-darken-2 mb-6" style="line-height: 1.6;">
            此預約已順利建檔，目前狀態為 <strong>待確認 (Pending)</strong>。<br>
            您可以直接前往首頁對該預約進行項目細目審核與收款確認。
          </p>
          <div class="d-flex flex-column gap-2" style="gap: 8px;">
            <v-btn color="orange-darken-2" rounded="pill" class="font-weight-bold text-white py-2" variant="elevated" @click="goToDashboard">
              🔍 前往訂單審查與確認
            </v-btn>
            <v-btn variant="text" rounded="pill" class="font-weight-bold text-grey-darken-1" @click="successDialog = false">
              留在本頁面
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 錯誤與成功提示 Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="top" rounded="xl" elevation="3">
      <span class="font-weight-bold">{{ snackbar.message }}</span>
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">關閉</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import apiClient from '../api/client';

const router = useRouter();
const route = useRoute();
const step = ref(1);
const loading = ref(false);
const successDialog = ref(false);
const createdReservationId = ref<number | null>(null);
const reservations = ref<any[]>([]);
const businessHours = ref({ start: '09:00', end: '21:00' });

const form = reactive({
  pet_id: null as number | null, 
  room_id: null as number | null,
  staff_id: null as number | null,
  start_datetime: '',
  end_datetime: '',
  needs_feeding: true,
  needs_walking: false,
  needs_medication: false,
  needs_grooming: false
});

const pets = ref<any[]>([]);
const rooms = ref<any[]>([]);
const staffs = ref<any[]>([]);

const translateSize = (size: string) => {
  const map: Record<string, string> = {
    Small: '小型套房',
    Medium: '中型套房',
    Large: '大型套房'
  };
  return map[size] || size;
};

// 獲取動態房間列表
const fetchRooms = async () => {
  try {
    const res = await apiClient.get('/resources/rooms');
    rooms.value = res.data.map((r: any) => {
      let icon = 'mdi-home-heart';
      let color = 'orange-lighten-1';
      let desc = '標準住宿套房，乾淨溫馨。';
      if (r.room_type === 'Small') {
        icon = 'mdi-home-heart';
        color = 'orange-lighten-1';
        desc = '適合 10kg 以下小型毛孩，附有柔軟睡墊與水碗。';
      } else if (r.room_type === 'Medium') {
        icon = 'mdi-home-modern';
        color = 'green-lighten-1';
        desc = '舒適寬敞，適合 10-20kg 中型毛孩。';
      } else if (r.room_type === 'Large') {
        icon = 'mdi-home-city';
        color = 'blue-lighten-1';
        desc = '旗艦豪華規格，適合 20kg 以上大毛寶貝。';
      }
      return {
        ...r,
        icon,
        color,
        desc
      };
    });

    // 載入完房間後，如果 URL query 中有 room_id，進行預填
    if (route.query.room_id) {
      form.room_id = Number(route.query.room_id);
    }
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
  }
};

const fetchStaffs = async () => {
  try {
    const res = await apiClient.get('/reservations/staffs');
    staffs.value = res.data.map((employee: any) => {
      const name = employee.name;
      let icon = 'mdi-account-star-outline';
      let color = 'orange-darken-1';
      let credentials: string[] = ['🧡 專業照護認證'];

      if (name.includes('Alice')) {
        icon = 'mdi-face-woman-shimmer';
        color = 'pink-darken-1';
        credentials = ['🛡️ 丙級美容證照', '🧡 寵物急救認證'];
      } else if (name.includes('Bob')) {
        icon = 'mdi-face-man-profile';
        color = 'blue-darken-1';
        credentials = ['🛡️ 丙級美容證照'];
      } else if (name.includes('Charlie')) {
        icon = 'mdi-face-man-shimmer';
        color = 'teal-darken-1';
        credentials = [];
      } else if (name.includes('Diana')) {
        icon = 'mdi-spa';
        color = 'purple-darken-1';
        credentials = ['🛡️ 丙級美容證照', '🌿 SPA 芳療證書'];
      }

      return {
        id: employee.id,
        name: employee.name,
        icon,
        experience: `${employee.experience_years || 1} 年`,
        specialty: employee.specialty || '寵物日常洗沐、日常照護',
        color,
        rating: Number(employee.rating) || 5.0,
        service_count: employee.service_count || 0,
        service_rate: employee.service_rate || 500,
        credentials
      };
    });
  } catch (error) {
    console.error('抓取排班員工失敗:', error);
  }
};

const snackbar = reactive({ show: false, message: '', color: 'error' });

// 智慧配房邏輯：依據動態房間列表，挑選第一個符合毛孩體型的房間
watch(() => form.pet_id, (newPetId) => {
  if (newPetId) {
    const selectedPet = pets.value.find(p => p.id === newPetId);
    if (selectedPet && rooms.value.length > 0) {
      const recommendedRoom = rooms.value.find(r => r.room_type === selectedPet.size);
      if (recommendedRoom) {
        form.room_id = recommendedRoom.id;
      } else {
        form.room_id = rooms.value[0].id;
      }
    }
  } else {
    form.room_id = null;
  }
});

const showAddDialog = ref(false);
const isAdding = ref(false);

const newPetForm = reactive({
  owner_name: '',
  phone: '',
  pet_name: '',
  size: 'Small',
  species: 'Dog',
  medical_history: '',
  notes: ''
});

const submitNewPet = async () => {
  if (!newPetForm.owner_name || !newPetForm.phone || !newPetForm.pet_name || !newPetForm.size || !newPetForm.species) {
    snackbar.color = 'warning'; snackbar.message = '請填寫所有必填欄位喔！'; snackbar.show = true; return;
  }
  isAdding.value = true;
  try {
    await apiClient.post('/reservations/pets', newPetForm);
    showAddDialog.value = false; snackbar.color = 'success'; snackbar.message = '資料建立並建檔成功！'; snackbar.show = true;
    newPetForm.owner_name = ''; newPetForm.phone = ''; newPetForm.pet_name = ''; newPetForm.size = 'Small'; newPetForm.species = 'Dog'; newPetForm.medical_history = ''; newPetForm.notes = '';
    await fetchPets();
  } catch (error: any) {
    snackbar.color = 'error'; snackbar.message = error.response?.data?.error || '建檔失敗，請確認電話號碼是否重複。'; snackbar.show = true;
  } finally {
    isAdding.value = false;
  }
};

const fetchPets = async () => {
  try {
    const response = await apiClient.get('/reservations/pets');
    pets.value = response.data.map((pet: any) => ({
      ...pet,
      display_name: `${pet.pet_name} (${pet.species === 'Dog' ? '🐶 狗' : '🐱 貓'} - 飼主: ${pet.owner_name} - ${pet.size === 'Small' ? '小型' : (pet.size === 'Medium' ? '中型' : '大型')})`
    }));
  } catch (error) {
    console.error('抓取寵物資料失敗:', error);
  }
};

const getSelectedPetName = () => {
  if (!form.pet_id) return '未選擇';
  const pet = pets.value.find(p => p.id === form.pet_id);
  return pet ? pet.pet_name : '未知寵物';
};

const getSelectedRoomName = () => {
  if (!form.room_id) return '不需住宿（僅美容）';
  const room = rooms.value.find(r => r.id === form.room_id);
  return room ? `${translateSize(room.room_type)} (房號 ${room.room_number}) - $${room.daily_rate}/晚` : '未知房間';
};

const getSelectedStaffName = () => {
  if (!form.staff_id) return '不需美容（僅住宿）';
  const staff = staffs.value.find(s => s.id === form.staff_id);
  return staff ? `${staff.name} - $${staff.service_rate}/次` : '未知服務人員';
};

const getSelectedCareServices = () => {
  const services = [];
  if (form.needs_feeding) services.push('🍽️ 餵食');
  if (form.needs_walking) services.push('👣 散步');
  if (form.needs_medication) services.push('💊 給藥');
  if (form.needs_grooming) services.push('✂️ 美容');
  return services.length > 0 ? services.join('、') : '無客製照護';
};

const validateAndGoToStep2 = () => {
  if (!form.start_datetime || !form.end_datetime) return;

  const now = new Date();
  const start = new Date(form.start_datetime);
  const end = new Date(form.end_datetime);

  // 1. 檢查是否為過去時間 (放寬 10 分鐘容差)
  if (start.getTime() < now.getTime() - 10 * 60 * 1000) {
    snackbar.color = 'error';
    snackbar.message = '⚠️ 入住時間不能是過去的時間！請重新選擇。';
    snackbar.show = true;
    return;
  }

  // 2. 檢查退房是否晚於入住
  if (end <= start) {
    snackbar.color = 'error';
    snackbar.message = '⚠️ 退房時間必須晚於入住時間！';
    snackbar.show = true;
    return;
  }

  // 3. 營業時間防呆比對
  const getHM = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const startHM = getHM(start);
  const endHM = getHM(end);

  if (startHM < businessHours.value.start || startHM > businessHours.value.end || endHM < businessHours.value.start || endHM > businessHours.value.end) {
    snackbar.color = 'error';
    snackbar.message = `⚠️ 預約時間不在營業時間內！本店營業時間為 ${businessHours.value.start} 至 ${businessHours.value.end}，請重新調整。`;
    snackbar.show = true;
    return;
  }

  step.value = 2;
};

const goToDashboard = () => {
  successDialog.value = false;
  router.push('/');
};

const submitReservation = async () => {
  loading.value = true;
  try {
    const res = await apiClient.post('/reservations', form);
    createdReservationId.value = res.data.reservation_id;
    successDialog.value = true;
    
    // 重設表單
    form.pet_id = null; form.room_id = null; form.staff_id = null; form.start_datetime = ''; form.end_datetime = '';
    form.needs_feeding = true; form.needs_walking = false; form.needs_medication = false; form.needs_grooming = false;
    step.value = 1;
    window.dispatchEvent(new Event('reservation-created'));
  } catch (error: any) {
    snackbar.color = 'error';
    if (error.response?.status === 409) {
      snackbar.message = error.response.data.message || '此時段資源已被佔用，請重新選擇。';
    } else {
      snackbar.message = error.response?.data?.error || error.response?.data?.message || '系統發生異常，請稍後再試。';
    }
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const fetchReservations = async () => {
  try {
    const response = await apiClient.get('/reservations');
    reservations.value = response.data;
  } catch (error) {
    console.error('抓取預約資料失敗:', error);
  }
};

const occupiedRoomIds = ref<number[]>([]);
const occupiedGroomerIds = ref<number[]>([]);

const checkAvailabilityStatus = async () => {
  if (!form.start_datetime || !form.end_datetime) {
    occupiedRoomIds.value = [];
    occupiedGroomerIds.value = [];
    return;
  }
  const start = new Date(form.start_datetime);
  const end = new Date(form.end_datetime);
  if (start >= end) {
    occupiedRoomIds.value = [];
    occupiedGroomerIds.value = [];
    return;
  }

  try {
    const res = await apiClient.get('/reservations/check-availability', {
      params: {
        start_time: form.start_datetime,
        end_time: form.end_datetime
      }
    });
    occupiedRoomIds.value = res.data.occupiedRoomIds || [];
    occupiedGroomerIds.value = res.data.occupiedGroomerIds || [];
  } catch (error) {
    console.error('Failed to check availability:', error);
  }
};

watch(() => [form.start_datetime, form.end_datetime], async () => {
  await checkAvailabilityStatus();
});

const isRoomFullForPetSize = computed(() => {
  if (!form.pet_id || rooms.value.length === 0 || !form.start_datetime || !form.end_datetime) return false;
  const selectedPet = pets.value.find(p => p.id === form.pet_id);
  if (!selectedPet) return false;
  
  const matchingRooms = rooms.value.filter(r => r.room_type === selectedPet.size);
  if (matchingRooms.length === 0) return false;
  
  return matchingRooms.every(r => occupiedRoomIds.value.includes(r.id));
});

const hasRoomConflict = computed(() => {
  if (!form.room_id || !form.start_datetime || !form.end_datetime) return false;
  const selectedRoom = rooms.value.find(r => r.id === form.room_id);
  if (!selectedRoom) return false;

  const start = new Date(form.start_datetime).getTime();
  const end = new Date(form.end_datetime).getTime();

  return reservations.value.some((r: any) => {
    if (r.room_number !== selectedRoom.room_number) return false;
    if (r.status === 'Cancelled') return false;
    const rStart = new Date(r.start_time).getTime();
    const rEnd = new Date(r.end_time).getTime();
    return start < rEnd && rStart < end;
  });
});

const hasStaffConflict = computed(() => {
  if (!form.staff_id || !form.start_datetime || !form.end_datetime) return false;
  const staff = staffs.value.find(s => s.id === form.staff_id);
  if (!staff) return false;

  const start = new Date(form.start_datetime).getTime();
  const end = new Date(form.end_datetime).getTime();

  return reservations.value.some((r: any) => {
    if (r.groomer_name !== staff.name) return false;
    if (r.status === 'Cancelled') return false;
    const rStart = new Date(r.start_time).getTime();
    const rEnd = new Date(r.end_time).getTime();
    return start < rEnd && rStart < end;
  });
});

const getDetailedRoomConflictInfo = computed(() => {
  if (!form.room_id || !form.start_datetime || !form.end_datetime) return '';
  const selectedRoom = rooms.value.find(r => r.id === form.room_id);
  if (!selectedRoom) return '';

  const start = new Date(form.start_datetime).getTime();
  const end = new Date(form.end_datetime).getTime();

  const conflictRes = reservations.value.find((r: any) => {
    if (r.room_number !== selectedRoom.room_number) return false;
    if (r.status === 'Cancelled') return false;
    const rStart = new Date(r.start_time).getTime();
    const rEnd = new Date(r.end_time).getTime();
    return start < rEnd && rStart < end;
  });

  if (conflictRes) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (dStr: string) => {
      const d = new Date(dStr);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const timeSlot = `${fmt(conflictRes.start_time)}至${fmt(conflictRes.end_time)}`;
    return `[${conflictRes.room_number}] [${timeSlot}] 已由 [${conflictRes.pet_name}] 預約，請重新選擇時間。`;
  }
  return '';
});

const getDetailedStaffConflictInfo = computed(() => {
  if (!form.staff_id || !form.start_datetime || !form.end_datetime) return '';
  const selectedStaff = staffs.value.find(s => s.id === form.staff_id);
  if (!selectedStaff) return '';

  const start = new Date(form.start_datetime).getTime();
  const end = new Date(form.end_datetime).getTime();

  const conflictRes = reservations.value.find((r: any) => {
    if (r.groomer_name !== selectedStaff.name) return false;
    if (r.status === 'Cancelled') return false;
    const rStart = new Date(r.start_time).getTime();
    const rEnd = new Date(r.end_time).getTime();
    return start < rEnd && rStart < end;
  });

  if (conflictRes) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (dStr: string) => {
      const d = new Date(dStr);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const timeSlot = `${fmt(conflictRes.start_time)}至${fmt(conflictRes.end_time)}`;
    return `[${conflictRes.groomer_name}] [${timeSlot}] 已由 [${conflictRes.pet_name}] 預約，請重新選擇時間。`;
  }
  return '';
});

const fetchSettings = async () => {
  try {
    const res = await apiClient.get('/settings');
    if (res.data.business_start_time) {
      businessHours.value.start = res.data.business_start_time;
    }
    if (res.data.business_end_time) {
      businessHours.value.end = res.data.business_end_time;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
};

onMounted(async () => {
  await fetchSettings();
  await fetchRooms();
  await fetchPets();
  await fetchReservations();
  await fetchStaffs();

  // 如果 URL query 中有 date 進行預填
  if (route.query.date) {
    const dStr = String(route.query.date);
    form.start_datetime = `${dStr}T09:00`;
    
    const nextDay = new Date(dStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const nextDayStr = `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`;
    form.end_datetime = `${nextDayStr}T09:00`;
  }

  if (form.start_datetime && form.end_datetime) {
    await checkAvailabilityStatus();
  }
});
</script>

<style scoped>
.room-card, .staff-card {
  cursor: pointer;
  border: 1px solid rgba(141, 110, 99, 0.15) !important;
  transition: all 0.25s ease !important;
}

.room-card:hover, .staff-card:hover {
  transform: translateY(-4px);
  border-color: #FFB74D !important;
  box-shadow: 0 6px 12px rgba(141, 110, 99, 0.08) !important;
}

.selected-card {
  border-color: #E65100 !important;
  border-width: 2px !important;
  box-shadow: 0 4px 10px rgba(230, 81, 0, 0.15) !important;
}

.conflict-border {
  border-color: #E53935 !important;
  border-width: 2.5px !important;
  box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2) !important;
}

@keyframes red-pulse {
  0%, 100% { border-color: #E53935; }
  50% { border-color: #FF8A80; }
}
.pulsing-red-border {
  animation: red-pulse 1.5s infinite;
}
</style>