<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">所有預約紀錄</div>
      <v-btn icon="mdi-refresh" @click="fetchReservations" :loading="loading" size="small"></v-btn>
    </div>
    
    <v-data-table
      :headers="headers"
      :items="reservations"
      class="elevation-1"
      item-value="id"
      :loading="loading"
    >
      <template v-slot:item.start_datetime="{ item }">
        {{ new Date((item as any).start_datetime).toLocaleString() }}
      </template>
      <template v-slot:item.end_datetime="{ item }">
        {{ new Date((item as any).end_datetime).toLocaleString() }}
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip :color="getStatusColor((item as any).status)" size="small">
          {{ (item as any).status }}
        </v-chip>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const headers = [
  { title: '訂單 ID', key: 'id' },
  { title: '寵物 ID', key: 'pet_id' },
  { title: '房間 ID', key: 'room_id' },
  { title: '美容師 ID', key: 'staff_id' },
  { title: '開始時間', key: 'start_datetime' },
  { title: '結束時間', key: 'end_datetime' },
  { title: '狀態', key: 'status' },
];

const reservations = ref([]);
const loading = ref(false);

const fetchReservations = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/reservations');
    reservations.value = res.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    CANCELLED: 'error',
    COMPLETED: 'info'
  };
  return map[status] || 'grey';
};

onMounted(() => {
  fetchReservations();
  window.addEventListener('reservation-created', fetchReservations);
});

onUnmounted(() => {
  window.removeEventListener('reservation-created', fetchReservations);
});
</script>
