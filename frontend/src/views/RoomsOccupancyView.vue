<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="align-center mb-6">
      <v-col cols="12" md="6" class="text-left">
        <div class="text-h4 font-weight-bold text-brown-darken-4">
          <v-icon icon="mdi-bed-outline" color="orange-darken-2" class="mr-2" size="large"></v-icon>
          房間營運狀況圖表
        </div>
        <div class="text-subtitle-1 text-grey-darken-1 mt-1">
          📊 以週為單位的房型預訂狀態，紅色警示表示有時間重疊衝突
        </div>
      </v-col>
      
      <!-- Date Selector controls -->
      <v-col cols="12" md="6" class="d-flex justify-md-end align-center gap-2">
        <v-btn icon="mdi-chevron-left" variant="tonal" color="brown-darken-2" @click="changeWeek(-1)"></v-btn>
        
        <v-btn variant="outlined" color="orange-darken-2" rounded="pill" class="font-weight-bold px-4">
          📅 {{ formatDateRangeLabel() }}
        </v-btn>
        
        <v-btn icon="mdi-chevron-right" variant="tonal" color="brown-darken-2" @click="changeWeek(1)"></v-btn>
        
        <v-btn color="brown-lighten-4" class="font-weight-bold text-brown-darken-4 ml-2" rounded="pill" @click="setToday">
          今天
        </v-btn>
      </v-col>
    </v-row>

    <!-- Room Gantt Weekly Grid -->
    <v-card rounded="xl" elevation="2" class="pa-4 border" style="border-color: #D7CCC8 !important; background-color: #FFFDF9; min-width: 900px; overflow-x: auto;">
      <v-table class="bg-transparent occupancy-table">
        <thead>
          <tr class="text-brown-darken-4">
            <!-- Room Column Header -->
            <th class="font-weight-black text-center text-body-1" style="width: 150px; background-color: #FFE0B2; border-radius: 12px 0 0 12px;">
              🚪 客房編號
            </th>
            <!-- 7 Days Columns Headers -->
            <th 
              v-for="day in weekDays" 
              :key="day.toISOString()" 
              class="font-weight-bold text-center py-3 text-body-2"
              :class="isToday(day) ? 'bg-orange-lighten-4 text-orange-darken-4 font-weight-black' : ''"
              style="width: 13.5%;"
            >
              <div>{{ getDayName(day) }}</div>
              <div class="text-caption mt-1">{{ formatDateStr(day) }}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in rooms" :key="room.id">
            <!-- Room Number & Type row header -->
            <td class="font-weight-bold text-center border-r" style="background-color: #FFF8E1;">
              <div class="text-body-1 text-brown-darken-4">{{ room.room_number }}</div>
              <v-chip size="x-small" :color="getRoomColor(room.room_type)" class="font-weight-bold mt-1 text-white">
                {{ room.room_type === 'Small' ? '小型房' : (room.room_type === 'Medium' ? '中型房' : '大型房') }}
              </v-chip>
            </td>

            <!-- 7 Days Grid Cells -->
            <td 
              v-for="day in weekDays" 
              :key="day.toISOString()" 
              class="pa-2 text-center align-start border-b position-relative"
              :class="isToday(day) ? 'bg-orange-lighten-5' : ''"
              style="height: 120px; vertical-align: top;"
            >
              <!-- List of reservations overlapping this room and day -->
              <div class="d-flex flex-column gap-2 h-100">
                <v-card
                  v-for="res in getReservationsForRoomAndDate(room.room_number, day)"
                  :key="res.id"
                  flat
                  rounded="lg"
                  class="pa-2 text-left border cursor-pointer res-cell-card"
                  :class="[
                    hasConflictOnDate(room.room_number, day) ? 'conflict-card pulsing-border' : '',
                    res.status === 'Confirmed' ? 'bg-green-lighten-5' : (res.status === 'Pending' ? 'bg-amber-lighten-5' : 'bg-grey-lighten-4')
                  ]"
                  :style="hasConflictOnDate(room.room_number, day) ? 'border-color: #E53935 !important; border-width: 1.5px;' : ''"
                  @click="openDetails(res)"
                >
                  <div class="d-flex justify-space-between align-center">
                    <span class="font-weight-bold text-caption text-brown-darken-4">🐾 {{ res.pet_name }}</span>
                    <v-chip 
                      size="x-small" 
                      :color="getStatusColor(res.status)" 
                      class="font-weight-bold text-white px-1"
                      style="font-size: 8px !important; height: 14px;"
                    >
                      {{ getStatusLabel(res.status) }}
                    </v-chip>
                  </div>
                  
                  <div class="text-caption text-grey-darken-3 mt-1" style="font-size: 10px !important; line-height: 1.2;">
                    {{ formatTime(res.start_time) }}<br>至 {{ formatTime(res.end_time) }}
                  </div>

                  <!-- Conflict Warning inside Card -->
                  <div 
                    v-if="hasConflictOnDate(room.room_number, day)" 
                    class="text-error font-weight-bold text-center mt-1 text-white bg-red-darken-1 rounded px-1" 
                    style="font-size: 8px !important;"
                  >
                    ⚠️ 時段重疊衝突！
                  </div>
                </v-card>

                <!-- Clickable Empty Cell -->
                <div 
                  v-if="getReservationsForRoomAndDate(room.room_number, day).length === 0" 
                  class="text-grey-lighten-2 text-caption pt-6 cursor-pointer h-100 d-flex align-center justify-center rounded-lg hover-cell"
                  @click="goToBooking(room.id, day)"
                  style="border: 1px dashed rgba(141, 110, 99, 0.1); min-height: 80px;"
                >
                  🛏️ 空房 (點擊預訂)
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailsDialog" max-width="500px">
      <v-card rounded="xl" class="pa-4 border">
        <v-card-title class="font-weight-bold text-brown-darken-4 d-flex align-center pb-2 border-b">
          <v-icon icon="mdi-information-outline" color="orange-darken-2" class="mr-2"></v-icon>
          預約詳細內容
        </v-card-title>
        
        <v-card-text class="pt-4 text-body-1 text-left">
          <v-row>
            <v-col cols="12" class="py-1">
              🐾 <strong>入住毛孩：</strong> {{ selectedRes?.pet_name }}
            </v-col>
            <v-col cols="12" class="py-1">
              🚪 <strong>客房編號：</strong> {{ selectedRes?.room_number || '無' }}
            </v-col>
            <v-col cols="12" class="py-1">
              💇 <strong>美容師：</strong> {{ selectedRes?.groomer_name || '無' }}
            </v-col>
            <v-col cols="12" class="py-1">
              📅 <strong>入住時間：</strong> {{ selectedRes ? new Date(selectedRes.start_time).toLocaleString() : '' }}
            </v-col>
            <v-col cols="12" class="py-1">
              🚪 <strong>退房時間：</strong> {{ selectedRes ? new Date(selectedRes.end_time).toLocaleString() : '' }}
            </v-col>
            <v-col cols="12" class="py-1" v-if="selectedRes?.total_amount !== null && selectedRes?.total_amount !== undefined">
              💰 <strong>實收金額：</strong> <span class="text-orange-darken-3 font-weight-bold">${{ selectedRes.total_amount }}</span>
            </v-col>
            <v-col cols="6" class="py-1">
              📋 <strong>預約狀態：</strong> 
              <v-chip :color="getStatusColor(selectedRes?.status)" size="x-small" class="font-weight-bold text-white ml-1">{{ selectedRes?.status }}</v-chip>
            </v-col>
            <v-col cols="6" class="py-1">
              💳 <strong>付款狀態：</strong> 
              <v-chip :color="getPaymentColor(selectedRes?.payment_status)" size="x-small" class="font-weight-bold ml-1" variant="tonal">
                {{ getPaymentLabel(selectedRes?.payment_status) }}
              </v-chip>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions class="pt-4 border-t d-flex justify-space-between align-center">
          <!-- 狀態變更按鈕 -->
          <v-menu v-if="selectedRes">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" color="orange-darken-3" variant="outlined" rounded="pill" class="font-weight-bold px-4" size="small">
                變更狀態 ⚙️
              </v-btn>
            </template>
            <v-list rounded="lg" density="compact">
              <v-list-item @click="changeResStatus(selectedRes.id, 'Confirmed')"><v-list-item-title class="text-success font-weight-bold text-caption">✅ 設為已確認</v-list-item-title></v-list-item>
              <v-list-item @click="changeResStatus(selectedRes.id, 'Completed')"><v-list-item-title class="text-grey-darken-2 font-weight-bold text-caption">🏠 設為已完成</v-list-item-title></v-list-item>
              <v-list-item @click="changeResStatus(selectedRes.id, 'Cancelled')"><v-list-item-title class="text-error font-weight-bold text-caption">❌ 設為已取消</v-list-item-title></v-list-item>
            </v-list>
          </v-menu>

          <v-btn color="grey-darken-1" class="font-weight-bold ml-auto" variant="text" rounded="pill" @click="detailsDialog = false">
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../api/client';

const router = useRouter();

// 資料狀態
const rooms = ref<any[]>([]);
const reservations = ref<any[]>([]);
const startDate = ref<Date>(new Date());
const detailsDialog = ref(false);
const selectedRes = ref<any>(null);

const setToday = () => {
  startDate.value = new Date();
};

const changeWeek = (direction: number) => {
  const newDate = new Date(startDate.value);
  newDate.setDate(newDate.getDate() + direction * 7);
  startDate.value = newDate;
};

// Generate 7 days in the week starting from startDate
const weekDays = computed(() => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate.value);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
});

const fetchRooms = async () => {
  try {
    const res = await apiClient.get('/resources/rooms');
    rooms.value = res.data;
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
  }
};

const fetchReservations = async () => {
  try {
    const res = await apiClient.get('/reservations');
    reservations.value = res.data;
  } catch (error) {
    console.error('抓取預約記錄失敗:', error);
  }
};

const goToBooking = (roomId: number, date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  router.push(`/reservation?room_id=${roomId}&date=${dateStr}`);
};

const changeResStatus = async (id: number, newStatus: string) => {
  try {
    await apiClient.patch(`/reservations/${id}/status`, { status: newStatus });
    detailsDialog.value = false;
    fetchReservations();
  } catch (error) {
    console.error('變更預約狀態失敗:', error);
  }
};

const getReservationsForRoomAndDate = (roomNumber: string, date: Date) => {
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(date);
  dateEnd.setHours(23, 59, 59, 999);

  return reservations.value.filter((r: any) => {
    if (r.room_number !== roomNumber) return false;
    if (r.status === 'Cancelled') return false; // 過濾已取消預約
    const rStart = new Date(r.start_time);
    const rEnd = new Date(r.end_time);
    return rStart <= dateEnd && rEnd >= dateStart;
  });
};

// Check if a room has overlapping Confirmed bookings on a specific date
const hasConflictOnDate = (roomNumber: string, date: Date) => {
  const resOnDay = getReservationsForRoomAndDate(roomNumber, date).filter(
    (r: any) => r.status === 'Confirmed' || r.status === 'Completed'
  );
  if (resOnDay.length <= 1) return false;

  // Check if any intervals overlap
  for (let i = 0; i < resOnDay.length; i++) {
    const r1Start = new Date(resOnDay[i].start_time).getTime();
    const r1End = new Date(resOnDay[i].end_time).getTime();

    for (let j = i + 1; j < resOnDay.length; j++) {
      const r2Start = new Date(resOnDay[j].start_time).getTime();
      const r2End = new Date(resOnDay[j].end_time).getTime();

      // Overlap condition: start1 < end2 AND start2 < end1
      if (r1Start < r2End && r2Start < r1End) {
        return true;
      }
    }
  }
  return false;
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const getDayName = (date: Date) => {
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  return days[date.getDay()];
};

const formatDateStr = (date: Date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatDateRangeLabel = () => {
  if (weekDays.value.length === 0) return '';
  const first = weekDays.value[0];
  const last = weekDays.value[6];
  return `${first.getFullYear()}年 ${first.getMonth() + 1}/${first.getDate()} ~ ${last.getMonth() + 1}/${last.getDate()}`;
};

const formatTime = (timeStr: string) => {
  const d = new Date(timeStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getRoomColor = (type: string) => {
  if (type === 'Small') return 'teal-darken-1';
  if (type === 'Medium') return 'orange-darken-1';
  return 'deep-orange-darken-2';
};

const getStatusColor = (status?: string) => {
  if (status === 'Confirmed') return 'success';
  if (status === 'Pending') return 'warning';
  if (status === 'Completed') return 'grey';
  return 'error';
};

const getStatusLabel = (status?: string) => {
  if (status === 'Confirmed') return '確';
  if (status === 'Pending') return '審';
  if (status === 'Completed') return '完';
  return '退';
};

const getPaymentColor = (paymentStatus?: string) => {
  const map: Record<string, string> = {
    Unpaid: 'red-darken-1',
    Held: 'orange-darken-2',
    Released: 'green-darken-2',
    Refunded: 'blue-darken-1'
  };
  return map[paymentStatus || ''] || 'grey';
};

const getPaymentLabel = (paymentStatus?: string) => {
  const map: Record<string, string> = {
    Unpaid: '💳 未付款',
    Held: '🔒 託管中',
    Released: '✅ 已結清',
    Refunded: '↩️ 已退款'
  };
  return map[paymentStatus || ''] || '💳 未付款';
};

const openDetails = (res: any) => {
  selectedRes.value = res;
  detailsDialog.value = true;
};

onMounted(async () => {
  await Promise.all([fetchRooms(), fetchReservations()]);
});
</script>

<style scoped>
.occupancy-table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
}

.occupancy-table th, .occupancy-table td {
  border: 1px solid rgba(141, 110, 99, 0.15) !important;
  font-size: 0.95rem;
}

.res-cell-card {
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(141, 110, 99, 0.08) !important;
}
.res-cell-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(141, 110, 99, 0.15) !important;
}

.hover-cell {
  transition: background-color 0.2s;
}
.hover-cell:hover {
  background-color: rgba(255, 204, 128, 0.15);
}

/* Pulsing warning border for scheduling conflicts */
@keyframes border-pulse {
  0%, 100% { border-color: #E53935; box-shadow: 0 0 4px rgba(229, 57, 53, 0.4); }
  50% { border-color: #FF8A80; box-shadow: 0 0 10px rgba(229, 57, 53, 0.1); }
}
.pulsing-border {
  animation: border-pulse 1.5s infinite;
}
.gap-2 {
  gap: 8px;
}
</style>
