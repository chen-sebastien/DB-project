<template>
  <v-container>
    <v-stepper v-model="step">
      <v-stepper-header>
        <v-stepper-item :complete="step > 1" title="選擇日期區間" value="1"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item :complete="step > 2" title="選擇資源" value="2"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item title="確認預約" value="3"></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item value="1">
          <v-text-field v-model="form.start_datetime" type="datetime-local" label="開始時間" required></v-text-field>
          <v-text-field v-model="form.end_datetime" type="datetime-local" label="結束時間" required></v-text-field>
          <v-btn color="primary" @click="step = 2">下一步</v-btn>
        </v-stepper-window-item>

        <v-stepper-window-item value="2">
          <v-select v-model="form.room_id" :items="rooms" item-title="room_type" item-value="id" label="選擇房型 (選填)" clearable></v-select>
          <v-select v-model="form.staff_id" :items="staffs" item-title="name" item-value="id" label="選擇美容師 (選填)" clearable></v-select>
          <v-btn variant="text" @click="step = 1" class="mr-2">上一步</v-btn>
          <v-btn color="primary" @click="step = 3">下一步</v-btn>
        </v-stepper-window-item>

        <v-stepper-window-item value="3">
          <v-card flat>
            <v-card-text>
              <div class="text-subtitle-1">時間：{{ form.start_datetime }} ~ {{ form.end_datetime }}</div>
              <div class="text-subtitle-1">資源：房間 ID {{ form.room_id || '無' }} / 美容師 ID {{ form.staff_id || '無' }}</div>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" @click="step = 2" class="mr-2">上一步</v-btn>
              <v-btn color="success" :loading="loading" @click="submitReservation">確認送出</v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="top">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">關閉</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import axios from 'axios';

const step = ref(1);
const loading = ref(false);

const form = reactive({
  pet_id: 1, // 預設使用 ID 1 的寵物
  room_id: null,
  staff_id: null,
  start_datetime: '',
  end_datetime: ''
});

// 假資料，實務上可從 GET /api/rooms 等 API 取得
const rooms = [{ id: 1, room_type: 'Standard' }, { id: 2, room_type: 'Deluxe' }];
const staffs = [{ id: 1, name: 'Alice Groomer' }, { id: 2, name: 'Bob Groomer' }];

const snackbar = reactive({ show: false, message: '', color: 'error' });

const submitReservation = async () => {
  loading.value = true;
  try {
    const response = await axios.post('/api/reservations', form);
    snackbar.color = 'success';
    snackbar.message = '預約成功！';
    snackbar.show = true;
    step.value = 1;
    // 成功後清空表單
    form.room_id = null;
    form.staff_id = null;
    form.start_datetime = '';
    form.end_datetime = '';
    
    // 觸發自定義事件通知 Dashboard 更新 (此處簡化處理)
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
</script>
