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
            
            <div class="d-flex justify-end mt-4">
              <v-btn
                color="orange-darken-2"
                rounded="pill"
                class="px-8 font-weight-bold"
                size="large"
                @click="step = 2"
                :disabled="!form.pet_id || !form.start_datetime || !form.end_datetime"
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
                  :color="form.room_id === room.id ? 'orange-lighten-5' : 'white'"
                  :class="['border h-100 room-card d-flex flex-column', form.room_id === room.id ? 'selected-card shadow-lg' : '']"
                  @click="form.room_id = room.id"
                  rounded="xl"
                  elevation="1"
                  style="transition: all 0.3s;"
                >
                  <v-img
                    src="/luxury_pet_room.png"
                    height="120"
                    cover
                    class="bg-grey-lighten-3"
                  ></v-img>
                  
                  <v-card-item class="pt-3 pb-1 flex-grow-1">
                    <v-card-title class="font-weight-bold text-brown-darken-4 text-body-1 d-flex justify-space-between align-center">
                      {{ room.room_type }}
                      <v-icon :icon="room.icon" :color="room.color" size="small"></v-icon>
                    </v-card-title>
                    <v-card-subtitle class="mt-1 text-caption">房號: {{ room.room_number }}</v-card-subtitle>
                  </v-card-item>

                  <v-card-text class="text-caption text-grey-darken-2 pb-3 pt-0">
                    {{ room.desc }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 2. 美容師卡片選擇區 -->
          <div class="text-left mb-6">
            <div class="text-subtitle-1 font-weight-bold text-brown-darken-4 mb-3">
              ✂️ 預約專屬美容服務 (選填)
            </div>
            <v-row>
              <v-col cols="12" sm="6" md="4" v-for="staff in staffs" :key="staff.id">
                <v-card
                  :color="form.staff_id === staff.id ? 'orange-lighten-5' : 'white'"
                  :class="['border h-100 staff-card d-flex flex-column', form.staff_id === staff.id ? 'selected-card shadow-lg' : '']"
                  @click="form.staff_id = staff.id === form.staff_id ? null : staff.id"
                  rounded="xl"
                  elevation="1"
                  style="transition: all 0.3s;"
                >
                  <v-card-item class="pt-4 pb-2">
                    <div class="d-flex align-center">
                      <v-avatar :color="staff.color" size="40" class="text-white mr-3 elevation-1">
                        <v-icon :icon="staff.icon"></v-icon>
                      </v-avatar>
                      <div class="text-left">
                        <v-card-title class="font-weight-bold text-brown-darken-4 pa-0 text-body-2">
                          {{ staff.name }}
                        </v-card-title>
                        <div class="d-flex align-center mt-1">
                          <v-rating
                            model-value="5"
                            readonly
                            density="compact"
                            size="x-small"
                            color="amber-accent-4"
                          ></v-rating>
                          <span class="text-caption text-grey-darken-1 ml-1" style="font-size: 10px !important;">資歷 {{ staff.experience }}</span>
                        </div>
                      </div>
                    </div>
                  </v-card-item>

                  <v-card-text class="text-caption text-grey-darken-2 pb-4 pt-1 flex-grow-1">
                    <strong>專長：</strong>{{ staff.specialty }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 上一步與下一步 -->
          <div class="d-flex justify-space-between mt-6">
            <v-btn variant="text" rounded="pill" class="font-weight-bold text-brown-lighten-1" @click="step = 1">⬅️ 返回時間</v-btn>
            <v-btn color="orange-darken-2" rounded="pill" class="px-8 font-weight-bold" @click="step = 3">下一步 ➡️</v-btn>
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
            <v-col cols="12" md="6">
              <v-text-field v-model="newPetForm.pet_name" label="寵物名字" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-dog" hide-details></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
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
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';

const step = ref(1);
const loading = ref(false);

const form = reactive({
  pet_id: null as number | null, 
  room_id: null as number | null,
  staff_id: null as number | null,
  start_datetime: '',
  end_datetime: ''
});

const pets = ref<any[]>([]);

const rooms = [
  { id: 1, room_type: 'S01 (標準小型套房)', room_number: 'S01', desc: '適合 10kg 以下小型毛孩。', icon: 'mdi-home-heart', color: 'orange-lighten-1' },
  { id: 2, room_type: 'S02 (奢華小型套房)', room_number: 'S02', desc: '附全天候視訊鏡頭與專屬玩具。', icon: 'mdi-video', color: 'orange-darken-1' },
  { id: 3, room_type: 'M01 (標準中型套房)', room_number: 'M01', desc: '寬敞舒適空間，適合 10~20kg 毛孩。', icon: 'mdi-home-modern', color: 'green-lighten-1' },
  { id: 4, room_type: 'M02 (奢華中型套房)', room_number: 'M02', desc: '附舒適加厚軟墊，適合 10~20kg 毛孩。', icon: 'mdi-dog-side', color: 'green-darken-1' },
  { id: 5, room_type: 'L01 (豪華旗艦大型套房)', room_number: 'L01', desc: '無障礙設計，適合 20kg 以上大毛寶貝。', icon: 'mdi-home-city', color: 'blue-lighten-1' }
];

const staffs = [
  { id: 1, name: 'Alice (店長)', icon: 'mdi-face-woman-shimmer', experience: '5 年', specialty: '大型犬安撫、高齡犬照護', color: 'pink-darken-1' },
  { id: 2, name: 'Bob (資深美容師)', icon: 'mdi-face-man-profile', experience: '3 年', specialty: '貓咪護理、特殊毛髮修剪', color: 'blue-darken-1' },
  { id: 3, name: 'Charlie (美容助理)', icon: 'mdi-face-man-shimmer', experience: '1 年', specialty: '基礎洗沐、剪甲護理', color: 'teal-darken-1' },
  { id: 4, name: 'Diana (SPA 芳療師)', icon: 'mdi-spa', experience: '4 年', specialty: '皮毛精油理療養護', color: 'purple-darken-1' }
];

const snackbar = reactive({ show: false, message: '', color: 'error' });

// 智慧配房邏輯
watch(() => form.pet_id, (newPetId) => {
  if (newPetId) {
    const selectedPet = pets.value.find(p => p.id === newPetId);
    if (selectedPet) {
      if (selectedPet.size === 'Small') form.room_id = 1;      
      else if (selectedPet.size === 'Medium') form.room_id = 3; 
      else if (selectedPet.size === 'Large') form.room_id = 5;  
    }
  } else {
    form.room_id = null;
  }
});

const showAddDialog = ref(false);
const isAdding = ref(false);

const newPetForm = reactive({
  owner_name: '', phone: '', pet_name: '', size: 'Small', medical_history: '', notes: ''
});

const submitNewPet = async () => {
  if (!newPetForm.owner_name || !newPetForm.phone || !newPetForm.pet_name || !newPetForm.size) {
    snackbar.color = 'warning'; snackbar.message = '請填寫所有必填欄位喔！'; snackbar.show = true; return;
  }
  isAdding.value = true;
  try {
    await axios.post('http://localhost:3000/api/reservations/pets', newPetForm);
    showAddDialog.value = false; snackbar.color = 'success'; snackbar.message = '資料建立並建檔成功！'; snackbar.show = true;
    newPetForm.owner_name = ''; newPetForm.phone = ''; newPetForm.pet_name = ''; newPetForm.size = 'Small'; newPetForm.medical_history = ''; newPetForm.notes = '';
    await fetchPets();
  } catch (error: any) {
    snackbar.color = 'error'; snackbar.message = error.response?.data?.error || '建檔失敗，請確認電話號碼是否重複。'; snackbar.show = true;
  } finally {
    isAdding.value = false;
  }
};

const fetchPets = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/reservations/pets');
    pets.value = response.data.map((pet: any) => ({
      ...pet,
      display_name: `${pet.pet_name} (飼主: ${pet.owner_name} - ${pet.size === 'Small' ? '小型犬' : (pet.size === 'Medium' ? '中型犬' : '大型犬')})`
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
  const room = rooms.find(r => r.id === form.room_id);
  return room ? `${room.room_type} (房號 ${room.room_number})` : '未知房間';
};

const getSelectedStaffName = () => {
  if (!form.staff_id) return '不需美容（僅住宿）';
  const staff = staffs.find(s => s.id === form.staff_id);
  return staff ? staff.name : '未知美容師';
};

const submitReservation = async () => {
  loading.value = true;
  try {
    await axios.post('http://localhost:3000/api/reservations', form);
    snackbar.color = 'success'; snackbar.message = '預約單送出成功！'; snackbar.show = true; step.value = 1;
    form.pet_id = null; form.room_id = null; form.staff_id = null; form.start_datetime = ''; form.end_datetime = '';
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

onMounted(() => {
  fetchPets();
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
</style>