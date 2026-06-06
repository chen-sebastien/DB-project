<template>
  <v-container>
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2" class="border h-100" style="border-color: #90CAF9 !important; background-color: #E3F2FD;">
          <v-card-title class="font-weight-bold text-blue-darken-4 pt-4">
            <v-icon icon="mdi-home-analytics" color="blue-darken-2" class="mr-2"></v-icon>
            今日即時住房率
          </v-card-title>
          <v-card-text class="text-center mt-2">
            <div class="text-h3 font-weight-bold text-blue-darken-3">
              {{ stats.occupancy.rate }}%
            </div>
            <div class="text-subtitle-2 text-grey-darken-2 mt-2">
              🛏️ 已入住：{{ stats.occupancy.occupied }} 間 / 總房數：{{ stats.occupancy.total }} 間
            </div>
            <v-progress-linear
              :model-value="stats.occupancy.rate"
              color="blue-darken-2"
              height="8"
              rounded
              class="mt-4"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2" class="border h-100" style="border-color: #FFCC80 !important; background-color: #FFF3E0;">
          <v-card-title class="font-weight-bold text-brown-darken-4 pt-4">
            <v-icon icon="mdi-chart-pie" color="orange-darken-2" class="mr-2"></v-icon>
            訂單狀態分佈
          </v-card-title>
          <v-card-text class="d-flex justify-space-around align-center mt-4">
            <div class="text-center" v-for="stat in parsedStatusStats" :key="stat.status">
              <div class="text-h4 font-weight-bold" :class="stat.colorClass">{{ stat.count }}</div>
              <div class="text-subtitle-2 text-grey-darken-2 mt-1">{{ stat.label }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2" class="border h-100" style="border-color: #A5D6A7 !important; background-color: #F1F8E9;">
          <v-card-title class="font-weight-bold text-green-darken-4 pt-4">
            <v-icon icon="mdi-medal" color="green-darken-2" class="mr-2"></v-icon>
            本月明星美容師
          </v-card-title>
          <v-card-text class="mt-1">
            <div v-if="stats.topGroomers.length === 0" class="text-grey text-center py-4">目前尚無排班資料</div>
            <v-list bg-color="transparent" density="compact" class="py-0">
              <v-list-item v-for="(groomer, index) in stats.topGroomers" :key="index" class="px-0">
                <template v-slot:prepend>
                  <v-avatar :color="index === 0 ? 'amber-accent-4' : 'grey-lighten-1'" size="28" class="text-white font-weight-bold mr-2">
                    {{ index + 1 }}
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold text-body-2">{{ groomer.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip color="green-darken-2" size="x-small" variant="elevated">
                    {{ groomer.task_count }} 單
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h5 font-weight-bold" style="color: #6D4C41;">
        <v-icon icon="mdi-clipboard-text-outline" color="brown-lighten-1" class="mr-2"></v-icon>
        所有預約紀錄
      </div>
      <v-btn icon="mdi-refresh" color="brown-lighten-4" @click="refreshAllData" :loading="loading" size="small" elevation="0"></v-btn>
    </div>
    
    <v-card rounded="xl" elevation="2" class="mb-8 border" style="border-color: #D7CCC8 !important; overflow: hidden;">
      <v-data-table 
        :headers="headers" 
        :items="reservations" 
        item-value="id" 
        :loading="loading" 
        hover 
        height="350px" 
        fixed-header 
        items-per-page="-1"
        :sort-by="[{ key: 'id', order: 'desc' }]"
      >
        <template v-slot:item.pet_name="{ item }"><strong>{{ (item as any).pet_name }}</strong></template>
        <template v-slot:item.room_number="{ item }">{{ (item as any).room_number || '無' }}</template>
        <template v-slot:item.groomer_name="{ item }">{{ (item as any).groomer_name || '無' }}</template>
        <template v-slot:item.start_time="{ item }">{{ new Date((item as any).start_time).toLocaleString([], {month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit'}) }}</template>
        <template v-slot:item.end_time="{ item }">{{ new Date((item as any).end_time).toLocaleString([], {month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit'}) }}</template>
        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor((item as any).status)" size="small" class="font-weight-bold">{{ (item as any).status }}</v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-menu>
            <template v-slot:activator="{ props }"><v-btn v-bind="props" variant="tonal" size="small" color="brown-darken-2" rounded="pill">修改狀態</v-btn></template>
            <v-list rounded="lg">
              <v-list-item @click="changeStatus((item as any).id, 'Confirmed')"><v-list-item-title class="text-success font-weight-bold">✅ 設為已確認</v-list-item-title></v-list-item>
              <v-list-item @click="changeStatus((item as any).id, 'Completed')"><v-list-item-title class="text-grey-darken-2 font-weight-bold">🏠 設為已完成</v-list-item-title></v-list-item>
              <v-list-item @click="changeStatus((item as any).id, 'Cancelled')"><v-list-item-title class="text-error font-weight-bold">❌ 設為已取消</v-list-item-title></v-list-item>
            </v-list>
          </v-menu>
        </template>
        <template v-slot:bottom></template>
      </v-data-table>
    </v-card>

    <v-divider class="my-6"></v-divider>
    <div class="d-flex justify-space-between align-center mb-2">
      <div class="text-h5 font-weight-bold" style="color: #FF8F00;">
        <v-icon icon="mdi-calendar-month" color="orange-darken-2" class="mr-2"></v-icon>
        照護行事曆看板
      </div>
    </div>

    <div class="agenda-scroll-container pb-4">
      <div v-if="groupedFeedingTasks.length === 0" class="text-center text-grey my-4">
        目前沒有任何排程喔！
      </div>

      <template v-for="group in groupedFeedingTasks" :key="group.date">
        <div class="d-flex align-center mt-6 mb-4">
          <v-chip color="orange-darken-3" size="large" class="font-weight-bold text-h6 px-4" elevation="2">
            {{ group.date }}
          </v-chip>
          <v-divider class="ml-4" color="orange-lighten-2" :thickness="2" style="opacity: 0.5;"></v-divider>
        </div>

        <v-row class="mb-2">
          <v-col v-for="task in group.tasks" :key="task.id" cols="12" md="6" xl="4">
            <v-card :color="task.is_fed ? 'green-lighten-5' : 'orange-lighten-5'" elevation="2" rounded="xl" class="border h-100 d-flex flex-column" :style="task.is_fed ? 'border-color: #A5D6A7 !important;' : 'border-color: #FFCC80 !important;'">
              <v-card-item>
                <template v-slot:prepend><v-icon :icon="task.is_fed ? 'mdi-check-circle' : 'mdi-dog'" :color="task.is_fed ? 'green-darken-2' : 'brown-darken-2'" size="x-large"></v-icon></template>
                <v-card-title class="font-weight-bold">{{ task.room_number || '未排房' }} - {{ task.pet_name }}</v-card-title>
                <v-card-subtitle class="mt-1">⏰ 時間：{{ new Date(task.feeding_time).toLocaleString([], {hour: '2-digit', minute:'2-digit'}) }}</v-card-subtitle>
              </v-card-item>
              
              <v-card-text class="text-body-1 mt-2 flex-grow-1">
                <v-alert v-if="task.medical_history" type="error" density="compact" variant="tonal" class="mb-2 font-weight-bold" icon="mdi-alert-octagon">醫療過敏：{{ task.medical_history }}</v-alert>
                <v-alert v-if="task.notes" type="warning" density="compact" variant="tonal" class="mb-2 font-weight-bold" icon="mdi-alert-circle">特別交代：{{ task.notes }}</v-alert>
                🍽️ <strong>餐點內容：</strong><br>{{ task.food_info }}
              </v-card-text>
              
              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn :color="task.is_fed ? 'green-darken-3' : 'deep-orange-darken-1'" :variant="task.is_fed ? 'outlined' : 'elevated'" rounded="pill" class="px-4 font-weight-bold" @click="toggleFeedStatus(task)">
                  {{ task.is_fed ? '✅ 已完成餵食' : '🍖 標記為已餵食' }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const headers = [
  { title: '訂單', key: 'id' },
  { title: '寵物', key: 'pet_name' },
  { title: '房號', key: 'room_number' },
  { title: '美容師', key: 'groomer_name' },
  { title: '開始時間', key: 'start_time' },
  { title: '結束時間', key: 'end_time' },
  { title: '狀態', key: 'status' },
  { title: '操作', key: 'actions', sortable: false },
];

const reservations = ref([]);
const loading = ref(false);

const fetchReservations = async () => {
  loading.value = true;
  try {
    const res = await axios.get('http://localhost:3000/api/reservations');
    reservations.value = res.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = { CONFIRMED: 'success', CANCELLED: 'error', COMPLETED: 'grey-darken-1' };
  return map[status?.toUpperCase()] || 'grey';
};

const changeStatus = async (id: number, newStatus: string) => {
  try {
    await axios.patch(`http://localhost:3000/api/reservations/${id}/status`, { status: newStatus });
    refreshAllData();
  } catch (error) {
    console.error('更新狀態失敗:', error);
  }
};

const stats = ref({
  statusStats: [] as any[],
  topGroomers: [] as any[],
  occupancy: { occupied: 0, total: 0, rate: 0 }
});

const fetchStats = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/reservations/stats');
    stats.value = res.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
};

const parsedStatusStats = computed(() => {
  const defaultStats = {
    Confirmed: { count: 0, label: '已確認', colorClass: 'text-green-darken-2' },
    Completed: { count: 0, label: '已完成', colorClass: 'text-grey-darken-2' },
    Cancelled: { count: 0, label: '已取消', colorClass: 'text-red-darken-2' }
  };
  stats.value.statusStats.forEach(stat => {
    if (defaultStats[stat.status as keyof typeof defaultStats]) {
      defaultStats[stat.status as keyof typeof defaultStats].count = stat.count;
    }
  });
  return Object.values(defaultStats);
});

const feedingTasks = ref<any[]>([]);
const fetchFeedingTasks = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/reservations/feeding');
    feedingTasks.value = res.data;
  } catch (error) {
    console.error('Error fetching feeding tasks:', error);
  }
};

const groupedFeedingTasks = computed(() => {
  const groups: Record<string, any[]> = {};
  
  feedingTasks.value.forEach(task => {
    const dateObj = new Date(task.feeding_time);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(task);
  });

  return Object.keys(groups).sort().map(date => ({ date: date, tasks: groups[date] }));
});

const toggleFeedStatus = async (task: any) => {
  try {
    const newStatus = !task.is_fed; 
    await axios.patch(`http://localhost:3000/api/reservations/feeding/${task.id}`, { is_fed: newStatus });
    task.is_fed = newStatus;
  } catch (error) {
    console.error('Error updating status:', error);
  }
};

const refreshAllData = () => {
  fetchReservations();
  fetchFeedingTasks();
  fetchStats();
};

onMounted(() => {
  refreshAllData();
  window.addEventListener('reservation-created', refreshAllData);
});

onUnmounted(() => {
  window.removeEventListener('reservation-created', refreshAllData);
});
</script>

<style scoped>
/* 專業級自訂捲軸樣式 */
.agenda-scroll-container {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 12px;
}

.agenda-scroll-container::-webkit-scrollbar {
  width: 8px;
}
.agenda-scroll-container::-webkit-scrollbar-track {
  background: #FFF3E0; 
  border-radius: 8px;
}
.agenda-scroll-container::-webkit-scrollbar-thumb {
  background: #FFB74D; 
  border-radius: 8px;
}
.agenda-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #FF9800; 
}
</style>