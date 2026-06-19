<template>
  <v-container fluid class="pa-6">
    <!-- Header Section -->
    <v-row class="align-center mb-6">
      <v-col cols="12" md="6" class="text-left">
        <div class="text-h4 font-weight-bold text-brown-darken-4">
          <v-icon icon="mdi-dog-side" color="orange-darken-2" class="mr-2" size="large"></v-icon>
          寵物檔案管理中心
        </div>
        <div class="text-subtitle-1 text-grey-darken-1 mt-1">
          🐾 檢視、新增或編輯毛孩與主人的檔案，隨時調整特別交代與病歷備註
        </div>
      </v-col>
      
      <!-- Search & Add Actions -->
      <v-col cols="12" md="6" class="d-flex justify-md-end align-center gap-2">
        <v-text-field
          v-model="searchQuery"
          placeholder="搜尋毛孩、主人姓名或電話..."
          variant="outlined"
          density="compact"
          color="orange-darken-2"
          prepend-inner-icon="mdi-magnify"
          hide-details
          rounded="pill"
          bg-color="white"
          style="max-width: 320px; width: 100%;"
        ></v-text-field>
        
        <v-btn 
          color="orange-darken-2" 
          prepend-icon="mdi-plus" 
          class="font-weight-bold ml-2 text-white" 
          rounded="pill"
          elevation="2"
          @click="openAddDialog"
        >
          建立檔案
        </v-btn>
      </v-col>
    </v-row>

    <!-- 頁籤導覽 -->
    <v-tabs v-model="activeTab" color="orange-darken-3" class="mb-6 font-weight-bold">
      <v-tab value="pets" class="text-body-1">
        <v-icon icon="mdi-dog-side" class="mr-2"></v-icon> 所有毛孩檔案
      </v-tab>
      <v-tab value="owners" class="text-body-1">
        <v-icon icon="mdi-account-group-outline" class="mr-2"></v-icon> 飼主清單管理
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- 毛孩檔案窗格 -->
      <v-window-item value="pets">
        <div v-if="loading" class="text-center my-8 py-8">
          <v-progress-circular color="orange-darken-2" indeterminate size="64"></v-progress-circular>
        </div>
        
        <div v-else-if="filteredPets.length === 0" class="text-center text-grey my-12 py-12 border rounded-xl" style="background-color: #FFFDF9; border-color: #D7CCC8 !important;">
          <v-icon icon="mdi-dog" size="x-large" class="text-grey-lighten-1 mb-2"></v-icon>
          <div class="text-subtitle-1 font-weight-bold text-brown-darken-2">找不到任何毛孩檔案喔！</div>
          <div class="text-caption text-grey mt-1">請嘗試其他搜尋條件，或點擊「建立檔案」新增檔案。</div>
        </div>

        <v-row v-else>
          <v-col v-for="pet in filteredPets" :key="pet.id" cols="12" sm="6" md="4" xl="3">
            <v-card rounded="xl" elevation="2" class="pa-4 border h-100 d-flex flex-column pet-card" style="border-color: #D7CCC8 !important; background-color: #FFFDF9;">
              <!-- Top info / Avatar -->
              <div class="d-flex align-start">
                <v-avatar :color="getPetAvatarColor(pet.size)" size="60" class="text-white mr-3 elevation-1">
                  <v-icon :icon="getPetIcon(pet.species)" size="36"></v-icon>
                </v-avatar>
                
                <div class="text-left flex-grow-1">
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-h6 font-weight-bold text-brown-darken-4">{{ pet.pet_name }}</span>
                    <v-chip size="x-small" :color="getPetSizeColor(pet.size)" class="font-weight-bold text-white">
                      {{ pet.size === 'Small' ? '小型' : (pet.size === 'Medium' ? '中型' : '大型') }}
                    </v-chip>
                  </div>
                  <div class="text-caption text-grey-darken-2 mt-1">
                    👨‍💼 飼主：{{ pet.owner_name }}
                  </div>
                  <div class="text-caption text-grey-darken-2">
                    📞 電話：{{ pet.phone }}
                  </div>
                </div>
              </div>

              <v-divider class="my-3" color="brown-lighten-4"></v-divider>

              <!-- Medical and Note Preferences -->
              <div class="text-left flex-grow-1 text-caption">
                <!-- Medical alert -->
                <div v-if="pet.medical_history" class="mb-2">
                  <v-chip color="red-darken-1" size="x-small" class="font-weight-bold text-white mb-1" variant="flat">
                    ⚠️ 醫療過敏史
                  </v-chip>
                  <div class="bg-red-lighten-5 pa-2 rounded-lg text-red-darken-4 border border-red-lighten-3 font-weight-medium">
                    {{ pet.medical_history }}
                  </div>
                </div>

                <!-- Care Notes -->
                <div v-if="pet.notes" class="mb-2">
                  <v-chip color="orange-darken-2" size="x-small" class="font-weight-bold text-white mb-1" variant="flat">
                    💡 特殊照顧備註
                  </v-chip>
                  <div class="bg-orange-lighten-5 pa-2 rounded-lg text-brown-darken-4 border border-orange-lighten-3 font-weight-medium">
                    {{ pet.notes }}
                  </div>
                </div>

                <div v-if="!pet.medical_history && !pet.notes" class="text-center text-grey-lighten-1 py-4">
                  🍃 無特殊醫療或照顾要求
                </div>
              </div>

              <!-- Actions -->
              <div class="d-flex justify-end mt-3 pt-2 border-t align-center w-100" style="border-top-style: dashed !important; border-color: rgba(141, 110, 99, 0.2) !important; gap: 8px;">
                <v-btn
                  v-if="currentUser?.role === 'Admin'"
                  variant="text"
                  size="small"
                  color="red"
                  class="font-weight-bold"
                  rounded="pill"
                  prepend-icon="mdi-delete-outline"
                  @click="handleDeletePet(pet)"
                >
                  刪除檔案
                </v-btn>
                <v-btn
                  variant="tonal"
                  size="small"
                  color="brown-darken-2"
                  class="font-weight-bold"
                  rounded="pill"
                  prepend-icon="mdi-pencil-outline"
                  @click="openEditDialog(pet)"
                >
                  編輯檔案
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- 飼主清單窗格 -->
      <v-window-item value="owners">
        <div v-if="loading" class="text-center my-8 py-8">
          <v-progress-circular color="orange-darken-2" indeterminate size="64"></v-progress-circular>
        </div>

        <div v-else-if="filteredOwners.length === 0" class="text-center text-grey my-12 py-12 border rounded-xl" style="background-color: #FFFDF9; border-color: #D7CCC8 !important;">
          <v-icon icon="mdi-account-group-outline" size="x-large" class="text-grey-lighten-1 mb-2"></v-icon>
          <div class="text-subtitle-1 font-weight-bold text-brown-darken-2">找不到任何飼主資料！</div>
        </div>

        <v-expansion-panels v-else variant="popout" class="my-4">
          <v-expansion-panel
            v-for="owner in filteredOwners"
            :key="owner.id"
            rounded="xl"
            class="mb-3 border shadow-sm"
            style="border-color: #D7CCC8 !important; overflow: hidden;"
          >
            <v-expansion-panel-title class="font-weight-bold text-brown-darken-4 py-4 px-6 bg-orange-lighten-5" @click="loadOwnerPets(owner.id)">
              <v-icon icon="mdi-account" class="mr-2" color="orange-darken-3"></v-icon>
              {{ owner.name }} 
              <span class="text-caption text-grey-darken-1 ml-4">📞 電話：{{ owner.phone }}</span>
              <v-chip size="x-small" color="orange-darken-2" class="font-weight-bold text-white ml-auto mr-4">
                {{ owner.pet_count }} 隻毛孩
              </v-chip>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text class="pt-4 bg-white">
              <div v-if="ownerPetsLoading[owner.id]" class="text-center py-4">
                <v-progress-circular color="orange-darken-2" indeterminate size="32"></v-progress-circular>
              </div>
              <div v-else-if="!ownerPets[owner.id] || ownerPets[owner.id].length === 0" class="text-center py-4 text-grey">
                這個飼主目前沒有建檔寵物
              </div>
              <v-row v-else>
                <v-col cols="12" sm="6" md="4" v-for="pet in ownerPets[owner.id]" :key="pet.id">
                  <v-card rounded="lg" class="pa-3 border text-left bg-orange-lighten-5" style="border-color: #FFE0B2 !important;">
                    <div class="d-flex align-center mb-2">
                      <v-avatar :color="getPetAvatarColor(pet.size)" size="36" class="text-white mr-2">
                        <v-icon :icon="getPetIcon(pet.species)" size="20"></v-icon>
                      </v-avatar>
                      <div>
                        <div class="font-weight-bold text-brown-darken-4 text-subtitle-2">{{ pet.name }}</div>
                        <v-chip size="x-small" :color="getPetSizeColor(pet.size)" class="font-weight-bold text-white mt-1">
                          {{ pet.size === 'Small' ? '小型' : (pet.size === 'Medium' ? '中型' : '大型') }}
                        </v-chip>
                      </div>
                    </div>
                    <div class="text-caption text-grey-darken-3">
                      <strong>過敏病史：</strong>{{ pet.medical_history || '無' }}<br>
                      <strong>特別照護：</strong>{{ pet.notes || '無' }}
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-window-item>
    </v-window>

    <!-- Add/Edit Pet Dialog -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card rounded="xl" class="border">
        <v-card-title class="bg-orange-lighten-4 text-brown-darken-4 font-weight-bold py-4 px-6 d-flex align-center">
          <v-icon :icon="isEdit ? 'mdi-pencil-box-outline' : 'mdi-card-account-details-outline'" class="mr-2" color="orange-darken-3"></v-icon>
          {{ isEdit ? '編輯毛孩檔案' : '建立毛孩與主人檔案' }}
        </v-card-title>
        
        <v-card-text class="pt-6 px-6">
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.owner_name" label="飼主姓名 *" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-account" :rules="[v => !!v || '請填寫飼主姓名']"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.phone" label="聯絡電話 *" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-phone" placeholder="例如: 0912345678" :rules="[v => !!v || '請填寫聯絡電話']"></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-4" color="brown-lighten-3"></v-divider>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.pet_name" label="寵物名字 *" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-dog" :rules="[v => !!v || '請填寫寵物名字']"></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.species"
                  :items="[{title: '🐶 狗 (Dog)', value: 'Dog'}, {title: '🐱 貓 (Cat)', value: 'Cat'}]"
                  item-title="title"
                  item-value="value"
                  label="寵物物種 *"
                  variant="outlined"
                  color="orange-darken-2"
                  prepend-inner-icon="mdi-cat"
                  :rules="[v => !!v || '請選擇物種']"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.size" :items="['Small', 'Medium', 'Large']" label="寵物體型 *" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-scale-balance" :rules="[v => !!v || '請選擇體型']"></v-select>
              </v-col>
            </v-row>
            <v-textarea v-model="form.medical_history" label="醫療史與過敏症狀 (選填)" variant="outlined" color="red-darken-2" prepend-inner-icon="mdi-medical-bag" rows="2" auto-grow placeholder="例如：對海鮮過敏、有心臟病..." class="mt-4" hide-details></v-textarea>
            <v-textarea v-model="form.notes" label="特別照護交代 (選填)" variant="outlined" color="orange-darken-2" prepend-inner-icon="mdi-note-edit-outline" rows="2" auto-grow placeholder="例如：很怕雷聲、有護食行為..." class="mt-4" hide-details></v-textarea>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pb-6 px-6 pt-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" rounded="pill" class="font-weight-bold text-grey-darken-1" @click="closeDialog">取消</v-btn>
          <v-btn color="orange-darken-2" variant="elevated" rounded="pill" class="px-6 font-weight-bold text-white" :loading="saving" @click="savePet">確認儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 二次確認彈窗 Ref -->
    <ConfirmDialog ref="confirmDialogRef" />

    <!-- Snackbar Alerts -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="top" rounded="xl">
      <span class="font-weight-bold">{{ snackbar.message }}</span>
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">關閉</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const route = useRoute();
const activeTab = ref('pets');

watch(() => route.path, (newPath) => {
  if (newPath === '/customers') {
    activeTab.value = 'owners';
  } else if (newPath === '/pets') {
    activeTab.value = 'pets';
  }
}, { immediate: true });

const pets = ref<any[]>([]);
const owners = ref<any[]>([]);
const ownerPets = ref<Record<number, any[]>>({});
const ownerPetsLoading = ref<Record<number, boolean>>({});

const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const dialog = ref(false);
const isEdit = ref(false);
const editingPetId = ref<number | null>(null);
const formRef = ref<any>(null);
const confirmDialogRef = ref<any>(null);

const form = reactive({
  owner_name: '',
  phone: '',
  pet_name: '',
  size: 'Small',
  species: 'Dog',
  medical_history: '',
  notes: ''
});

const snackbar = reactive({ show: false, message: '', color: 'success' });

const showToast = (message: string, color = 'success') => {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
};

const currentUser = computed(() => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
});

const filteredPets = computed(() => {
  if (!searchQuery.value) return pets.value;
  const q = searchQuery.value.toLowerCase();
  return pets.value.filter(
    (pet: any) =>
      pet.pet_name.toLowerCase().includes(q) ||
      pet.owner_name.toLowerCase().includes(q) ||
      pet.phone.includes(q)
  );
});

const filteredOwners = computed(() => {
  if (!searchQuery.value) return owners.value;
  const q = searchQuery.value.toLowerCase();
  return owners.value.filter(
    (owner: any) =>
      owner.name.toLowerCase().includes(q) ||
      owner.phone.includes(q)
  );
});

const fetchPets = async (setLoadingState = false) => {
  if (setLoadingState) loading.value = true;
  try {
    const response = await apiClient.get('/reservations/pets');
    pets.value = response.data;
  } catch (error) {
    console.error('抓取寵物資料失敗:', error);
  } finally {
    if (setLoadingState) loading.value = false;
  }
};

const fetchOwners = async () => {
  try {
    const res = await apiClient.get('/owners');
    owners.value = res.data;
  } catch (error) {
    console.error('Failed to fetch owners:', error);
  }
};

const loadOwnerPets = async (ownerId: number) => {
  if (ownerPets.value[ownerId]) return;
  ownerPetsLoading.value[ownerId] = true;
  try {
    const res = await apiClient.get(`/owners/${ownerId}/pets`);
    ownerPets.value[ownerId] = res.data;
  } catch (error) {
    console.error('Failed to load owner pets:', error);
  } finally {
    ownerPetsLoading.value[ownerId] = false;
  }
};

const openAddDialog = () => {
  isEdit.value = false;
  editingPetId.value = null;
  form.owner_name = '';
  form.phone = '';
  form.pet_name = '';
  form.size = 'Small';
  form.species = 'Dog';
  form.medical_history = '';
  form.notes = '';
  dialog.value = true;
};

const openEditDialog = (pet: any) => {
  isEdit.value = true;
  editingPetId.value = pet.id;
  form.owner_name = pet.owner_name;
  form.phone = pet.phone;
  form.pet_name = pet.pet_name;
  form.size = pet.size;
  form.species = pet.species || 'Dog';
  form.medical_history = pet.medical_history || '';
  form.notes = pet.notes || '';
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  if (formRef.value) formRef.value.resetValidation();
};

const savePet = async () => {
  const validateRes = await formRef.value?.validate();
  if (!validateRes || !validateRes.valid) return;

  saving.value = true;
  try {
    if (isEdit.value && editingPetId.value) {
      await apiClient.put(`/reservations/pets/${editingPetId.value}`, form);
      showToast('毛孩檔案更新成功！');
    } else {
      await apiClient.post('/reservations/pets', form);
      showToast('毛孩與飼主建檔成功！');
    }
    
    dialog.value = false;
    loading.value = true;
    try {
      await Promise.all([fetchPets(false), fetchOwners()]);
    } finally {
      loading.value = false;
    }
    // Reset ownerPets cache for this owner to reload next time
    ownerPets.value = {};
  } catch (error: any) {
    const msg = error.response?.data?.error || '儲存檔案失敗，請檢查電話號碼是否重複。';
    showToast(msg, 'error');
  } finally {
    saving.value = false;
  }
};

const handleDeletePet = async (pet: any) => {
  const isConfirmed = await confirmDialogRef.value?.open({
    title: '⚠️ 確定要刪除寵物檔案？',
    message: `您確定要刪除毛孩 ${pet.pet_name} (飼主: ${pet.owner_name}) 的檔案嗎？刪除後，該毛孩的歷史預約紀錄也將被同步刪除！`,
    confirmText: '確定刪除',
    cancelText: '取消',
    confirmColor: 'red'
  });

  if (!isConfirmed) return;

  try {
    await apiClient.delete(`/reservations/pets/${pet.id}`);
    showToast('寵物檔案已成功刪除！');
    loading.value = true;
    try {
      await Promise.all([fetchPets(false), fetchOwners()]);
    } finally {
      loading.value = false;
    }
    ownerPets.value = {};
  } catch (error: any) {
    const msg = error.response?.data?.message || error.response?.data?.error || '刪除失敗，該毛孩目前有未來的預約安排！';
    showToast(msg, 'error');
  }
};

const getPetIcon = (species: string) => {
  return species?.toLowerCase() === 'cat' ? 'mdi-cat' : 'mdi-dog';
};

const getPetAvatarColor = (size: string) => {
  if (size === 'Small') return 'teal-lighten-1';
  if (size === 'Medium') return 'orange-lighten-2';
  return 'deep-orange-lighten-2';
};

const getPetSizeColor = (size: string) => {
  if (size === 'Small') return 'teal-darken-1';
  if (size === 'Medium') return 'orange-darken-1';
  return 'deep-orange-darken-2';
};

onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([fetchPets(false), fetchOwners()]);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.pet-card {
  transition: transform 0.25s, box-shadow 0.25s;
}
.pet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(109, 76, 65, 0.12) !important;
  border-color: #FFB74D !important;
}
.gap-2 {
  gap: 8px;
}
</style>
