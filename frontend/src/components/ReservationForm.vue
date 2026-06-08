<template>
  <v-container>
    <v-stepper v-model="step" rounded="xl" elevation="3" class="border" style="border-color: #FFCC80 !important;">
      <v-stepper-header>
        <v-stepper-item :complete="step > 1" title="選擇入住寵物與時間" :value="1" color="orange-darken-2"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item :complete="step > 2" title="智慧配房與資源" :value="2" color="orange-darken-2"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item title="確認預約" :value="3" color="orange-darken-2"></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item :value="1">
          <v-alert
            color="blue-lighten-5"
            border="start"
            border-color="blue-darken-2"
            elevation="1"
            class="mb-6 pa-4 rounded-lg"
          >
            <div class="d-flex align-center justify-space-between w-100 flex-wrap gap-4">
              <div>
                <div class="text-h6 font-weight-bold text-blue-darken-3 mb-1">
                  <v-icon icon="mdi-information" class="mr-1 pb-1"></v-icon> 找不到寵物資料嗎？
                </div>
                <div class="text-body-2 text-blue-darken-2 font-weight-medium">
                  若為初次入住的毛孩，請務必先點擊右方按鈕，建立完整的飼主與醫療史檔案！
                </div>
              </div>
              <v-btn
                color="blue-darken-3"
                variant="elevated"
                prepend-icon="mdi-paw"
                class="font-weight-bold px-6"
                size="large"
                rounded="pill"
                elevation="3"
                @click="showAddDialog = true" 
              >
                🐾 新增飼主與寵物
              </v-btn>
            </div>
          </v-alert>

          <v-select v-model="form.pet_id" :items="pets" item-title="display_name" item-value="id" label="請選擇入住寵物" required variant="outlined" color="orange-darken-2"></v-select>
          <v-text-field v-model="form.start_datetime" type="datetime-local" label="開始時間" required variant="outlined" color="orange-darken-2"></v-text-field>
          <v-text-field v-model="form.end_datetime" type="datetime-local" label="結束時間" required variant="outlined" color="orange-darken-2"></v-text-field>
          
          <v-btn color="orange-darken-2" rounded="pill" class="px-6 font-weight-bold" @click="step = 2" :disabled="!form.pet_id || !form.start_datetime || !form.end_datetime">下一步</v-btn>
        </v-stepper-window-item>

        <v-stepper-window-item :value="2">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4" icon="mdi-magic-staff">
            系統已根據毛孩體型為您自動推薦合適房型！您也可以手動更改。
          </v-alert>

          <v-select v-model="form.room_id" :items="rooms" item-title="room_type" item-value="id" label="選擇房型" clearable variant="outlined" color="orange-darken-2">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" :subtitle="item.raw.desc">
                <template v-slot:prepend>
                  <v-icon :color="item.raw.color" class="mr-3" size="large">{{ item.raw.icon }}</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-select v-model="form.staff_id" :items="staffs" item-title="name" item-value="id" label="選擇專屬美容師 (選填)" clearable variant="outlined" color="orange-darken-2">
            <template v-slot:selection="{ item }">
              <v-chip :color="item.raw.color" size="small" class="font-weight-bold text-white">
                <v-icon start>{{ item.raw.icon }}</v-icon>
                {{ item.title }}
              </v-chip>
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title" :subtitle="`⭐ 資歷：${item.raw.experience} | ✂️ 專長：${item.raw.specialty}`">
                <template v-slot:prepend>
                  <v-avatar :color="item.raw.color" size="36" class="text-white mr-3">
                    <v-icon>{{ item.raw.icon }}</v-icon>
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-btn variant="text" rounded="pill" @click="step = 1" class="mr-2">上一步</v-btn>
          <v-btn color="orange-darken-2" rounded="pill" class="px-6 font-weight-bold" @click="step = 3">下一步</v-btn>
        </v-stepper-window-item>

        <v-stepper-window-item :value="3">
          <v-card flat>
            <v-card-text class="text-body-1">
              <div class="mb-2">🐾 <strong>入住寵物：</strong>{{ getSelectedPetName() }}</div>
              <div class="mb-2">⏰ <strong>預約時間：</strong>{{ form.start_datetime?.replace('T', ' ') }} ~ {{ form.end_datetime?.replace('T', ' ') }}</div>
              <div class="mb-2">🏠 <strong>預約資源：</strong>房間 ID {{ form.room_id || '無' }} / 美容師 ID {{ form.staff_id || '無' }}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" rounded="pill" @click="step = 2" class="mr-2">上一步</v-btn>
              <v-btn color="green-darken-2" rounded="pill" class="px-6 font-weight-bold" elevation="2" :loading="loading" @click="submitReservation">✨ 確認送出</v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <v-dialog v-model="showAddDialog" max-width="600" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-orange-lighten-4 text-brown-darken-4 font-weight-bold py-3">
          <v-icon icon="mdi-card-account-details" class="mr-2"></v-icon>新增顧客與寵物資料
        </v-card-title>
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="newPetForm.owner_name" label="飼主姓名" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-account" hide-details class="mb-2"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="newPetForm.phone" label="聯絡電話" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-phone" placeholder="例如: 0912345678" hide-details class="mb-2"></v-text-field></v-col>
          </v-row>
          <v-divider class="my-3"></v-divider>
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="newPetForm.pet_name" label="寵物名字" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-dog" hide-details class="mb-2"></v-text-field></v-col>
            <v-col cols="12" md="6"><v-select v-model="newPetForm.size" :items="['Small', 'Medium', 'Large']" label="寵物體型" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-scale-balance" hide-details class="mb-2"></v-select></v-col>
          </v-row>
          <v-textarea v-model="newPetForm.medical_history" label="醫療與過敏史 (選填)" variant="outlined" color="red-darken-2" prepend-inner-icon="mdi-medical-bag" rows="2" auto-grow placeholder="例如：對雞肉過敏、有心臟病..." class="mt-4" hide-details></v-textarea>
          <v-textarea v-model="newPetForm.notes" label="特別交代備註 (選填)" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-note-edit" rows="2" auto-grow placeholder="例如：很怕雷聲、洗澡需戴頭套..." class="mt-4" hide-details></v-textarea>
        </v-card-text>
        <v-card-actions class="pb-4 px-4 pt-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" rounded="pill" @click="showAddDialog = false">取消</v-btn>
          <v-btn color="orange-darken-2" variant="elevated" rounded="pill" class="px-6 font-weight-bold" :loading="isAdding" @click="submitNewPet">確認建檔</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="top" rounded="pill">
      {{ snackbar.message }}
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
  { id: 1, room_type: 'S01 (標準小型犬)', desc: '溫馨單間，適合 10kg 以下', icon: 'mdi-home-heart', color: 'orange-lighten-1' },
  { id: 2, room_type: 'S02 (豪華小型犬)', desc: '附全天候視訊鏡頭與專屬玩具', icon: 'mdi-video', color: 'orange-darken-1' },
  { id: 3, room_type: 'M01 (標準中型犬)', desc: '寬敞空間，適合 10~20kg', icon: 'mdi-home-modern', color: 'green-lighten-1' },
  { id: 4, room_type: 'L01 (無障礙大房)', desc: '適合 20kg 以上或高齡大狗狗', icon: 'mdi-home-city', color: 'blue-lighten-1' },
  { id: 5, room_type: 'C01 (貓咪跳台房)', desc: '挑高設計，貓咪專屬舒壓空間', icon: 'mdi-cat', color: 'purple-lighten-1' }
];

const staffs = [
  { id: 1, name: 'Alice (店長)', icon: 'mdi-face-woman-shimmer', experience: '5 年', specialty: '大型犬安撫、高齡犬照護', color: 'pink-darken-1' },
  { id: 2, name: 'Bob (資深美容師)', icon: 'mdi-face-man-profile', experience: '3 年', specialty: '貓咪護理、特殊毛髮修剪', color: 'blue-darken-1' },
  { id: 3, name: 'Charlie (美容助理)', icon: 'mdi-face-man-shimmer', experience: '1 年', specialty: '基礎洗沐、剪甲護理', color: 'teal-darken-1' },
  { id: 4, name: 'Diana (SPA 芳療師)', icon: 'mdi-spa', experience: '4 年', specialty: '寵物皮毛養護、精油按摩', color: 'purple-darken-1' }
];

const snackbar = reactive({ show: false, message: '', color: 'error' });

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
    showAddDialog.value = false; snackbar.color = 'success'; snackbar.message = '資料建檔成功！'; snackbar.show = true;
    newPetForm.owner_name = ''; newPetForm.phone = ''; newPetForm.pet_name = ''; newPetForm.size = 'Small'; newPetForm.medical_history = ''; newPetForm.notes = '';
    await fetchPets();
  } catch (error: any) {
    snackbar.color = 'error'; snackbar.message = error.response?.data?.error || '建檔失敗，請確認資料是否正確。'; snackbar.show = true;
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
  return pet ? pet.display_name : '未知寵物';
};

const submitReservation = async () => {
  loading.value = true;
  try {
    await axios.post('http://localhost:3000/api/reservations', form);
    snackbar.color = 'success'; snackbar.message = '預約成功！'; snackbar.show = true; step.value = 1;
    form.pet_id = null; form.room_id = null; form.staff_id = null; form.start_datetime = ''; form.end_datetime = '';
    window.dispatchEvent(new Event('reservation-created'));
  } catch (error: any) {
    snackbar.color = 'error';
    if (error.response?.status === 409) {
      snackbar.message = error.response.data.message || '此時段資源已被佔用，請重新選擇。';
    } else {
      snackbar.message = error.response?.data?.error || '系統發生異常，請稍後再試。';
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