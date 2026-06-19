<template>
  <v-container fluid class="pa-4">
    <!-- Brand Title Bar -->
    <div class="d-flex align-center mb-6">
      <v-avatar color="orange-lighten-5" size="48" class="mr-3 border" style="border-color: #FFE0B2 !important;">
        <v-icon icon="mdi-monitor-dashboard" color="orange-darken-3" size="28"></v-icon>
      </v-avatar>
      <div class="text-left">
        <h1 class="text-h4 font-weight-bold text-brown-darken-4 mb-1">PawNest 儀表板</h1>
        <p class="text-caption text-brown-lighten-1">寵物旅館管理系統 · 今日即時數據與工作排程</p>
      </div>
    </div>

    <!-- Today Summary Section: High-Priority Metrics Grid & To-Do Task List -->
    <v-row class="mb-6">
      <!-- Left Part: Metric Cards Grid -->
      <v-col cols="12" lg="8">
        <v-row>
          <!-- Metric Card 1: 今日即時住房率 -->
          <v-col cols="12" sm="6" md="4">
            <v-card 
              rounded="xl" 
              elevation="2" 
              class="border h-100 glass-card-blue cursor-pointer text-left" 
              style="border-color: #90CAF9 !important; background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);"
              @click="handleCardClick('Occupancy')"
            >
              <v-card-title class="font-weight-bold text-blue-darken-4 pt-4 d-flex align-center text-subtitle-1">
                <v-icon icon="mdi-home-analytics" color="blue-darken-2" class="mr-2"></v-icon>
                今日即時住房率
              </v-card-title>
              <v-card-text class="d-flex flex-column align-center justify-center py-4">
                <v-progress-circular
                  :model-value="stats.occupancy.rate"
                  :size="80"
                  :width="8"
                  color="blue-darken-3"
                  class="mb-3"
                >
                  <span class="text-h6 font-weight-bold text-blue-darken-4">{{ stats.occupancy.rate }}%</span>
                </v-progress-circular>
                <div class="text-caption text-blue-darken-3 font-weight-medium">
                  🛏️ 已入住：{{ stats.occupancy.occupied }} 間 / 總房數：{{ stats.occupancy.total }} 間
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Metric Card 2: 今日入住 -->
          <v-col cols="12" sm="6" md="4">
            <v-card 
              rounded="xl" 
              elevation="2" 
              class="border h-100 glass-card-green cursor-pointer text-left" 
              style="border-color: #A5D6A7 !important; background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);"
              @click="handleCardClick('TodayCheckIns')"
            >
              <v-card-title class="font-weight-bold text-green-darken-4 pt-4 d-flex align-center text-subtitle-1">
                <v-icon icon="mdi-login" color="green-darken-2" class="mr-2"></v-icon>
                今日入住
              </v-card-title>
              <v-card-text class="d-flex flex-column align-center justify-center py-5">
                <div class="text-h3 font-weight-bold text-green-darken-4 mb-2">{{ todayCheckInsCount }}</div>
                <div class="text-caption text-green-darken-3 font-weight-medium">
                  點擊以過濾預約列表
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Metric Card 3: 今日退房 -->
          <v-col cols="12" sm="6" md="4">
            <v-card 
              rounded="xl" 
              elevation="2" 
              class="border h-100 glass-card-orange cursor-pointer text-left" 
              style="border-color: #FFB74D !important; background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);"
              @click="handleCardClick('TodayCheckOuts')"
            >
              <v-card-title class="font-weight-bold text-orange-darken-4 pt-4 d-flex align-center text-subtitle-1">
                <v-icon icon="mdi-logout" color="orange-darken-2" class="mr-2"></v-icon>
                今日退房
              </v-card-title>
              <v-card-text class="d-flex flex-column align-center justify-center py-5">
                <div class="text-h3 font-weight-bold text-orange-darken-4 mb-2">{{ todayCheckOutsCount }}</div>
                <div class="text-caption text-orange-darken-3 font-weight-medium">
                  點擊以過濾預約列表
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Metric Card 4: 今日美容 -->
          <v-col cols="12" sm="6" md="4">
            <v-card 
              rounded="xl" 
              elevation="2" 
              class="border h-100 glass-card-pink cursor-pointer text-left" 
              style="border-color: #F48FB1 !important; background: linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%);"
              @click="handleCardClick('TodayGrooming')"
            >
              <v-card-title class="font-weight-bold text-pink-darken-4 pt-4 d-flex align-center text-subtitle-1">
                <v-icon icon="mdi-content-cut" color="pink-darken-2" class="mr-2"></v-icon>
                今日美容
              </v-card-title>
              <v-card-text class="d-flex flex-column align-center justify-center py-5">
                <div class="text-h3 font-weight-bold text-pink-darken-4 mb-2">{{ todayGroomingCount }}</div>
                <div class="text-caption text-pink-darken-3 font-weight-medium">
                  點擊以過濾預約列表
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Metric Card 5: 待確認預約 -->
          <v-col cols="12" sm="6" md="4">
            <v-card 
              rounded="xl" 
              elevation="2" 
              class="border h-100 glass-card-amber cursor-pointer text-left" 
              style="border-color: #FFE082 !important; background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);"
              @click="handleCardClick('Pending')"
            >
              <v-card-title class="font-weight-bold text-amber-darken-4 pt-4 d-flex align-center text-subtitle-1">
                <v-icon icon="mdi-alert-circle-outline" color="amber-darken-2" class="mr-2"></v-icon>
                待確認預約
              </v-card-title>
              <v-card-text class="d-flex flex-column align-center justify-center py-5">
                <div class="text-h3 font-weight-bold text-amber-darken-4 mb-2">{{ pendingReservationsCount }}</div>
                <div class="text-caption text-amber-darken-3 font-weight-medium">
                  需要立即審批
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Metric Card 6: 可用空房數 -->
          <v-col cols="12" sm="6" md="4">
            <v-card 
              rounded="xl" 
              elevation="2" 
              class="border h-100 glass-card-teal cursor-pointer text-left" 
              style="border-color: #80CBC4 !important; background: linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%);"
              @click="handleCardClick('AvailableRooms')"
            >
              <v-card-title class="font-weight-bold text-teal-darken-4 pt-4 d-flex align-center text-subtitle-1">
                <v-icon icon="mdi-bed" color="teal-darken-2" class="mr-2"></v-icon>
                可用空房數
              </v-card-title>
              <v-card-text class="d-flex flex-column align-center justify-center py-5">
                <div class="text-h3 font-weight-bold text-teal-darken-4 mb-2">{{ availableRoomsCount }}</div>
                <div class="text-caption text-teal-darken-3 font-weight-medium">
                  房況圖表快速查閱
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Right Part: Today's To-Do Task List -->
      <v-col cols="12" lg="4">
        <v-card rounded="xl" elevation="2" class="pa-5 border h-100 d-flex flex-column text-left" style="border-color: #BCAAA4 !important; background-color: #FFFDF9;">
          <v-card-title class="font-weight-bold text-brown-darken-4 px-0 pt-0 d-flex align-center text-subtitle-1">
            <v-icon icon="mdi-checkbox-marked-circle-outline" color="brown-darken-2" class="mr-2"></v-icon>
            今日照護待辦清單
          </v-card-title>
          <v-card-text class="px-0 pb-0 overflow-y-auto flex-grow-1" style="max-height: 230px;">
            <div v-if="todayTodoTasks.length === 0" class="text-center text-grey py-8">
              <v-icon icon="mdi-check-all" color="green-darken-1" size="large" class="mb-2"></v-icon>
              <div class="text-caption font-weight-bold text-green-darken-3">今天的所有照護工作都完成了！🎉</div>
            </div>
            <v-list v-else bg-color="transparent" density="compact" class="py-0">
              <v-list-item v-for="(todo, idx) in todayTodoTasks" :key="idx" class="px-0 py-1">
                <div class="d-flex align-center w-100">
                  <v-checkbox
                    hide-details
                    density="compact"
                    color="success"
                    class="d-inline-flex mr-2"
                    @change="handleTodoCheck(todo)"
                  ></v-checkbox>
                  <span class="text-body-2 text-brown-darken-3 text-truncate" style="max-width: 250px;" :title="todo.label">{{ todo.label }}</span>
                </div>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Two-Column Layout -->
    <v-row>
      <!-- Left Column: Reservations Table (7/12 width on large screens) -->
      <v-col cols="12" lg="7">
        <v-card id="reservations-card" rounded="xl" elevation="2" class="pa-5 border h-100" style="border-color: #D7CCC8 !important; background-color: #FFFDF9;">
          <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-4 gap-2">
            <div class="text-h5 font-weight-bold text-brown-darken-4">
              <v-icon icon="mdi-clipboard-text-outline" color="orange-darken-2" class="mr-2"></v-icon>
              所有預約紀錄
            </div>
            <div class="d-flex align-center gap-2" style="width: 100%; max-width: 320px;">
              <v-text-field
                v-model="searchQuery"
                density="compact"
                placeholder="搜尋寵物、房型或美容師..."
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                color="orange-darken-2"
                hide-details
                rounded="pill"
                bg-color="white"
                class="flex-grow-1"
              ></v-text-field>
              <v-btn icon="mdi-refresh" color="brown-lighten-4" @click="refreshAllData" :loading="loading" size="small" elevation="0"></v-btn>
            </div>
          </div>

          <!-- Status Filter Tabs -->
          <div class="d-flex flex-wrap mb-4" style="gap: 6px;">
            <v-chip
              v-for="filter in statusFilters"
              :key="filter.value"
              :color="statusFilter === filter.value ? 'orange-darken-3' : 'grey-lighten-1'"
              :variant="statusFilter === filter.value ? 'flat' : 'outlined'"
              size="small"
              class="font-weight-bold cursor-pointer"
              @click="statusFilter = filter.value"
            >
              {{ filter.label }}
            </v-chip>
          </div>

          <!-- 骨架屏載入狀態 (loading === true) -->
          <div v-if="loading" class="py-4">
            <v-skeleton-loader type="table-heading, table-thead, table-tbody" class="bg-transparent"></v-skeleton-loader>
          </div>

          <!-- 預約列表內容 (loading === false) -->
          <template v-else>
            <!-- 空狀態 (filteredReservations.length === 0) -->
            <v-empty-state
              v-if="filteredReservations.length === 0"
              icon="mdi-clipboard-text-search-outline"
              title="無符合條件的預約紀錄"
              text="目前無符合所選狀態的預約或美容訂單，請嘗試更改篩選或關鍵字搜尋。"
              class="py-6"
            ></v-empty-state>

            <!-- 桌面端表格視圖 (>= md) -->
            <v-data-table 
              v-else-if="mdAndUp"
              :headers="headers" 
              :items="filteredReservations" 
              :search="searchQuery"
              item-value="id" 
              hover 
              height="400px" 
              fixed-header 
              items-per-page="-1"
              :sort-by="[{ key: 'id', order: 'desc' }]"
              class="bg-transparent text-left"
            >
              <template v-slot:item.pet_name="{ item }"><strong>{{ (item as any).pet_name }}</strong></template>
              <template v-slot:item.room_number="{ item }">{{ (item as any).room_number || '無' }}</template>
              <template v-slot:item.groomer_name="{ item }">{{ (item as any).groomer_name || '無' }}</template>
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
              <template v-slot:item.total_amount="{ item }">
                <span class="font-weight-bold text-orange-darken-3" v-if="(item as any).total_amount !== null && (item as any).total_amount !== undefined">
                  ${{ (item as any).total_amount }}
                </span>
                <span class="text-caption text-grey" v-else>尚未計費</span>
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor((item as any).status)" size="x-small" class="font-weight-bold text-white">{{ (item as any).status === 'Pending' ? '待確認' : ((item as any).status === 'Confirmed' ? '已確認' : ((item as any).status === 'Completed' ? '已完成' : '已取消')) }}</v-chip>
              </template>
              <template v-slot:item.payment_status="{ item }">
                <v-chip :color="getPaymentColor((item as any).payment_status)" size="x-small" class="font-weight-bold" variant="tonal">
                  {{ getPaymentLabel((item as any).payment_status) }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <div class="d-flex align-center gap-1">
                  <v-btn
                    color="blue-darken-1"
                    variant="text"
                    size="x-small"
                    icon="mdi-eye-outline"
                    @click="openDetailsDialog(item)"
                    title="查看完整明細與核對表"
                  ></v-btn>
                  <v-btn 
                    v-if="(item as any).status === 'Pending'" 
                    color="orange-darken-2" 
                    variant="flat"
                    size="x-small" 
                    rounded="pill" 
                    class="font-weight-bold text-white px-2"
                    @click="openReviewDialog(item)"
                  >
                    🔍 審核與收款
                  </v-btn>
                  <v-menu v-else>
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" variant="tonal" size="x-small" color="brown-darken-2" rounded="pill" class="font-weight-bold">狀態 ⚙️</v-btn>
                    </template>
                    <v-list rounded="lg" density="compact">
                      <v-list-item @click="changeStatus((item as any).id, 'Confirmed')"><v-list-item-title class="text-success font-weight-bold text-caption">✅ 設為已確認</v-list-item-title></v-list-item>
                      <v-list-item @click="changeStatus((item as any).id, 'Completed')"><v-list-item-title class="text-grey-darken-2 font-weight-bold text-caption">🏠 設為已完成</v-list-item-title></v-list-item>
                      <v-list-item @click="changeStatus((item as any).id, 'Cancelled')"><v-list-item-title class="text-error font-weight-bold text-caption">❌ 設為已取消</v-list-item-title></v-list-item>
                      <!-- 退款項目 -->
                      <v-list-item 
                        v-if="(item as any).status === 'Confirmed' && ((item as any).payment_status === 'Held' || (item as any).payment_status === 'Released')" 
                        @click="handleRefundOrder(item)"
                      >
                        <v-list-item-title class="text-info font-weight-bold text-caption">↩️ 標記為已退款</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </template>
              <template v-slot:bottom></template>
            </v-data-table>

            <!-- 行動端卡片堆疊視圖 (< md) -->
            <div v-else class="d-flex flex-column gap-2 mt-2">
              <v-card 
                v-for="item in filteredReservations" 
                :key="item.id" 
                rounded="xl" 
                class="border pa-4 text-left elevation-1" 
                style="border-color: #E0D4CE !important; background-color: #FAF8F5;"
              >
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-caption font-weight-bold text-grey-darken-1">單號 #{{ item.id }}</span>
                  <v-chip :color="getStatusColor(item.status)" size="x-small" class="font-weight-bold text-white">
                    {{ item.status === 'Pending' ? '待確認' : (item.status === 'Confirmed' ? '已確認' : (item.status === 'Completed' ? '已完成' : '已取消')) }}
                  </v-chip>
                </div>
                <div class="text-h6 font-weight-bold text-brown-darken-4 mb-1">🐾 {{ item.pet_name }}</div>
                <div class="text-caption text-brown-lighten-1 mb-2">
                  🛏️ 房號: {{ item.room_number || '無' }} · 💇 美容師: {{ item.groomer_name || '無' }}
                </div>
                <div class="text-caption text-grey-darken-3 mb-2">
                  📅 入住: {{ new Date(item.start_time).toLocaleString([], {month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit'}) }}<br/>
                  📅 退房: {{ new Date(item.end_time).toLocaleString([], {month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit'}) }}
                </div>
                <div class="d-flex justify-space-between align-center mt-3 pt-3 border-t">
                  <div>
                    <span class="text-caption text-grey">實收金額：</span>
                    <span class="font-weight-bold text-orange-darken-3" v-if="item.total_amount !== null">
                      ${{ item.total_amount }}
                    </span>
                    <span class="text-caption text-grey" v-else>尚未計費</span>
                  </div>
                  <div class="d-flex gap-1">
                    <v-btn
                      color="blue-darken-1"
                      variant="tonal"
                      size="small"
                      icon="mdi-eye-outline"
                      @click="openDetailsDialog(item)"
                    ></v-btn>
                    <v-btn 
                      v-if="item.status === 'Pending'" 
                      color="orange-darken-2" 
                      variant="flat"
                      size="small" 
                      class="font-weight-bold text-white rounded-pill px-3"
                      @click="openReviewDialog(item)"
                    >
                      審核
                    </v-btn>
                    <v-menu v-else>
                      <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" variant="tonal" size="small" color="brown-darken-2" class="font-weight-bold rounded-pill">操作 ⚙️</v-btn>
                      </template>
                      <v-list rounded="lg" density="compact">
                        <v-list-item @click="changeStatus(item.id, 'Confirmed')"><v-list-item-title class="text-success font-weight-bold text-caption">✅ 已確認</v-list-item-title></v-list-item>
                        <v-list-item @click="changeStatus(item.id, 'Completed')"><v-list-item-title class="text-grey-darken-2 font-weight-bold text-caption">🏠 已完成</v-list-item-title></v-list-item>
                        <v-list-item @click="changeStatus(item.id, 'Cancelled')"><v-list-item-title class="text-error font-weight-bold text-caption">❌ 已取消</v-list-item-title></v-list-item>
                        <v-list-item 
                          v-if="item.status === 'Confirmed' && (item.payment_status === 'Held' || item.payment_status === 'Released')" 
                          @click="handleRefundOrder(item)"
                        >
                          <v-list-item-title class="text-info font-weight-bold text-caption">↩️ 已退款</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </div>
              </v-card>
            </div>
          </template>
        </v-card>
      </v-col>

      <!-- Right Column: Chronological Care Timeline (5/12 width on large screens) -->
      <v-col cols="12" lg="5">
        <v-card rounded="xl" elevation="2" class="pa-5 border h-100 d-flex flex-column" style="border-color: #FFCC80 !important; background-color: #FFFDF9;">
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-h5 font-weight-bold text-orange-darken-4">
              <v-icon icon="mdi-calendar-clock" color="orange-darken-2" class="mr-2"></v-icon>
              照護時間軸看板
            </div>
            <!-- Task Filter Chips -->
            <div class="d-flex align-center" style="gap: 4px;">
              <v-btn-toggle
                v-model="taskFilter"
                mandatory
                density="compact"
                color="orange-darken-3"
                rounded="pill"
                selected-class="bg-orange-darken-2 text-white"
              >
                <v-btn value="All" size="x-small" class="font-weight-bold">全部</v-btn>
                <v-btn value="Pending" size="x-small" class="font-weight-bold">待餵食</v-btn>
                <v-btn value="Warning" size="x-small" class="font-weight-bold">醫療警示</v-btn>
              </v-btn-toggle>
            </div>
          </div>

          <div class="agenda-scroll-container flex-grow-1">
            <!-- 骨架屏載入狀態 -->
            <div v-if="loading" class="py-4">
              <v-skeleton-loader type="list-item-avatar-three-line, list-item-avatar-three-line" class="bg-transparent"></v-skeleton-loader>
            </div>

            <template v-else>
              <!-- 空狀態 -->
              <v-empty-state
                v-if="filteredGroupedTasks.length === 0"
                icon="mdi-calendar-blank-outline"
                title="目前沒有照護任務"
                text="所選條件下，無待處理的餵食、散步或照護排程。"
                class="py-6"
              ></v-empty-state>

              <template v-else v-for="group in filteredGroupedTasks" :key="group.date">
                <!-- Date separator header with add feeding task button -->
                <div class="d-flex align-center my-4 justify-space-between w-100">
                  <span class="text-caption font-weight-bold text-brown-darken-3 px-3 py-1 rounded-pill bg-orange-lighten-4">
                    📅 {{ group.date }}
                  </span>
                  <v-btn
                    variant="text"
                    density="compact"
                    color="orange-darken-3"
                    prepend-icon="mdi-plus"
                    class="font-weight-bold text-caption ml-2"
                    @click="openAddFeedingTaskDialog(group.date)"
                  >
                    新增餵食任務
                  </v-btn>
                  <v-divider class="ml-2 flex-grow-1" color="orange-lighten-3"></v-divider>
                </div>

                <!-- Vertical Timeline -->
                <v-timeline density="compact" side="end" class="align-start py-0 pl-1">
                  <v-timeline-item
                    v-for="task in group.tasks"
                    :key="task.id"
                    :dot-color="isAllCompleted(task) ? 'green-darken-1' : (task.medical_history ? 'red-darken-1' : 'orange-darken-1')"
                    size="x-small"
                    class="mb-4"
                  >
                    <template v-slot:icon>
                      <v-icon 
                        :icon="isAllCompleted(task) ? 'mdi-check' : (task.medical_history ? 'mdi-alert-octagon' : 'mdi-clock-outline')" 
                        color="white" 
                        size="12"
                      ></v-icon>
                    </template>

                    <v-card 
                      flat 
                      rounded="xl" 
                      class="border pa-3 text-left w-100"
                      :class="[
                        task.medical_history && !isAllCompleted(task) ? 'risk-card-high' : '',
                        isAllCompleted(task) ? 'bg-green-lighten-5 border-green-lighten-2' : (task.medical_history ? 'bg-red-lighten-5 border-red-lighten-2' : 'bg-orange-lighten-5 border-orange-lighten-2')
                      ]"
                      :style="isAllCompleted(task) ? 'border-color: #C8E6C9 !important;' : (task.medical_history ? 'border-color: #FFCDD2 !important; border-width: 1.5px;' : 'border-color: #FFE0B2 !important;')"
                    >
                      <div class="d-flex justify-space-between align-center mb-1">
                        <div class="font-weight-bold text-brown-darken-4 text-subtitle-2">
                          🚪 {{ task.room_number || '未排房' }} - {{ task.pet_name }}
                        </div>
                        <div class="d-flex align-center gap-1">
                          <!-- 編輯餵食任務 -->
                          <v-btn
                            icon="mdi-pencil-outline"
                            variant="text"
                            density="compact"
                            color="brown-darken-1"
                            size="small"
                            @click="openEditFeedingTaskDialog(task)"
                            title="編輯餵食內容"
                          ></v-btn>
                          <v-chip size="x-small" :color="task.is_fed ? 'green-darken-3' : 'orange-darken-3'" class="font-weight-bold" variant="flat">
                            ⏰ {{ new Date(task.feeding_time).toLocaleString([], {hour: '2-digit', minute:'2-digit'}) }}
                          </v-chip>
                        </div>
                      </div>

                      <!-- 餵食內容顯示 -->
                      <div class="text-caption text-grey-darken-3 mb-2">
                        🍖 <strong>餵食：</strong>{{ task.food_info }}
                      </div>

                      <!-- Medical alert -->
                      <v-alert 
                        v-if="task.medical_history" 
                        type="error" 
                        density="compact" 
                        variant="tonal"
                        class="mb-2 py-1 px-2 font-weight-bold text-caption rounded-lg" 
                        icon="mdi-alert-octagon"
                      >⚠️ 醫療警示：{{ task.medical_history }}</v-alert>

                      <!-- Special notes -->
                      <v-alert 
                        v-if="task.notes" 
                        type="warning" 
                        density="compact" 
                        variant="tonal" 
                        class="mb-2 py-1 px-2 font-weight-bold text-caption rounded-lg" 
                        icon="mdi-alert-circle"
                      >💡 交代：{{ task.notes }}</v-alert>

                      <!-- Dynamic Care Services Checklist -->
                      <div class="text-caption text-brown-darken-4 mt-2">
                        <strong>照護核對清單：</strong>
                        <div class="d-flex flex-wrap gap-1 mt-1" style="gap: 4px;">
                          <!-- 餵食 (針對單次 timeline task) -->
                          <v-chip 
                            v-if="task.needs_feeding" 
                            :color="task.is_fed ? 'success' : 'grey-lighten-2'" 
                            size="x-small" 
                            variant="flat" 
                            class="text-white font-weight-bold cursor-pointer"
                            @click="toggleTimelineTaskItem(task, 'is_fed')"
                          >
                            {{ task.is_fed ? '✅ 餵食完成' : '🍽️ 待餵食' }}
                          </v-chip>
                          <!-- 散步 -->
                          <v-chip 
                            v-if="task.needs_walking" 
                            :color="task.walk_completed ? 'success' : 'grey-lighten-2'" 
                            size="x-small" 
                            variant="flat" 
                            class="text-white font-weight-bold cursor-pointer"
                            @click="toggleTimelineTaskItem(task, 'is_walked')"
                          >
                            {{ task.walk_completed ? '✅ 散步完成' : '👣 待散步' }}
                          </v-chip>
                          <!-- 给药 -->
                          <v-chip 
                            v-if="task.needs_medication" 
                            :color="task.medication_completed ? 'success' : 'grey-lighten-2'" 
                            size="x-small" 
                            variant="flat" 
                            class="text-white font-weight-bold cursor-pointer"
                            @click="toggleTimelineTaskItem(task, 'is_medicated')"
                          >
                            {{ task.medication_completed ? '✅ 給藥完成' : '💊 待給藥' }}
                          </v-chip>
                          <!-- 美容 -->
                          <v-chip 
                            v-if="task.needs_grooming" 
                            :color="task.grooming_completed ? 'success' : 'grey-lighten-2'" 
                            size="x-small" 
                            variant="flat" 
                            class="text-white font-weight-bold cursor-pointer"
                            @click="toggleTimelineTaskItem(task, 'is_groomed')"
                          >
                            {{ task.grooming_completed ? '✅ 美容完成' : '✂️ 待美容' }}
                          </v-chip>
                          <span v-if="!task.needs_feeding && !task.needs_walking && !task.needs_medication && !task.needs_grooming" class="text-caption text-grey">無照護服務需求</span>
                        </div>
                      </div>
                    </v-card>
                  </v-timeline-item>
                </v-timeline>
              </template>
            </template>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 預約完整明細與照護核對對話框 -->
    <v-dialog v-model="detailsDialog" max-width="580px" persistent>
      <v-card rounded="xl" class="pa-4 border">
        <v-card-title class="font-weight-bold text-brown-darken-4 d-flex align-center pb-2 border-b">
          <v-icon icon="mdi-file-document-edit-outline" color="blue-darken-2" class="mr-2"></v-icon>
          預約單明細與照護服務確認表
        </v-card-title>
        
        <v-card-text class="pt-4 text-body-2 text-left">
          <!-- 寵物與飼主資訊 -->
          <v-row class="mb-4">
            <v-col cols="12" sm="6" class="py-1">
              <strong>🐾 寵物姓名：</strong>{{ selectedRes?.pet_name }}
            </v-col>
            <v-col cols="12" sm="6" class="py-1">
              <strong>房號 / 美容師：</strong>{{ selectedRes?.room_number || '無' }} / {{ selectedRes?.groomer_name || '無' }}
            </v-col>
            <v-col cols="12" class="py-1">
              <strong>預約時段：</strong>
              <div class="text-caption text-grey-darken-2">
                {{ selectedRes ? new Date(selectedRes.start_time).toLocaleString() : '' }} 至 <br>
                {{ selectedRes ? new Date(selectedRes.end_time).toLocaleString() : '' }}
              </div>
            </v-col>
            <v-col cols="12" sm="6" class="py-1">
              <strong>實收金額：</strong>
              <span class="text-orange-darken-3 font-weight-bold" v-if="selectedRes?.total_amount !== null && selectedRes?.total_amount !== undefined">
                ${{ selectedRes.total_amount }} ({{ translatePaymentMethod(selectedRes.payment_method) }})
              </span>
              <span class="text-grey" v-else>尚未計費</span>
            </v-col>
            <v-col cols="12" sm="6" class="py-1">
              <strong>訂單狀態：</strong>
              <v-chip :color="getStatusColor(selectedRes?.status)" size="x-small" class="font-weight-bold text-white">
                {{ selectedRes?.status === 'Pending' ? '待確認' : (selectedRes?.status === 'Confirmed' ? '已確認' : (selectedRes?.status === 'Completed' ? '已完成' : '已取消')) }}
              </v-chip>
            </v-col>
            <v-col cols="12" sm="6" class="py-1">
              <strong>付款狀態：</strong>
              <v-chip :color="getPaymentColor(selectedRes?.payment_status)" size="x-small" class="font-weight-bold" variant="tonal">
                {{ getPaymentLabel(selectedRes?.payment_status) }}
              </v-chip>
            </v-col>
          </v-row>

          <v-divider class="my-3"></v-divider>

          <!-- 照護確認清單 -->
          <div class="mb-2">
            <div class="font-weight-bold text-brown-darken-4 mb-2">📋 照護服務核對清單：</div>
            <v-card variant="outlined" rounded="xl" class="pa-4 bg-orange-lighten-5 border-0">
              <v-row>
                <!-- 餵食 -->
                <v-col cols="12" class="py-1 d-flex align-center justify-space-between" v-if="selectedRes?.needs_feeding">
                  <span class="font-weight-medium">🍽️ 餵食服務</span>
                  <v-checkbox-btn
                    v-model="selectedRes.fed_completed"
                    :true-value="1"
                    :false-value="0"
                    color="success"
                    @change="toggleCareItem(selectedRes, 'fed_completed')"
                  ></v-checkbox-btn>
                </v-col>
                <!-- 散步 -->
                <v-col cols="12" class="py-1 d-flex align-center justify-space-between" v-if="selectedRes?.needs_walking">
                  <span class="font-weight-medium">👣 散步陪伴</span>
                  <v-checkbox-btn
                    v-model="selectedRes.walk_completed"
                    :true-value="1"
                    :false-value="0"
                    color="success"
                    @change="toggleCareItem(selectedRes, 'walk_completed')"
                  ></v-checkbox-btn>
                </v-col>
                <!-- 給藥 -->
                <v-col cols="12" class="py-1 d-flex align-center justify-space-between" v-if="selectedRes?.needs_medication">
                  <span class="font-weight-medium">💊 協助給藥</span>
                  <v-checkbox-btn
                    v-model="selectedRes.medication_completed"
                    :true-value="1"
                    :false-value="0"
                    color="success"
                    @change="toggleCareItem(selectedRes, 'medication_completed')"
                  ></v-checkbox-btn>
                </v-col>
                <!-- 美容 -->
                <v-col cols="12" class="py-1 d-flex align-center justify-space-between" v-if="selectedRes?.needs_grooming">
                  <span class="font-weight-medium">✂️ 美容洗沐</span>
                  <v-checkbox-btn
                    v-model="selectedRes.grooming_completed"
                    :true-value="1"
                    :false-value="0"
                    color="success"
                    @change="toggleCareItem(selectedRes, 'grooming_completed')"
                  ></v-checkbox-btn>
                </v-col>
                
                <v-col cols="12" class="py-2 text-center text-grey text-caption" v-if="!selectedRes?.needs_feeding && !selectedRes?.needs_walking && !selectedRes?.needs_medication && !selectedRes?.needs_grooming">
                  此訂單無勾選任何客製化照護服務項目
                </v-col>
              </v-row>
            </v-card>
          </div>
        </v-card-text>
        
        <v-card-actions class="pb-4 px-4 pt-2 border-t">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" rounded="pill" class="font-weight-bold" @click="detailsDialog = false">關閉</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 訂單明細審核與收款對話框 -->
    <v-dialog v-model="reviewDialog" max-width="520px" persistent>
      <v-card rounded="xl" class="pa-4 border">
        <v-card-title class="font-weight-bold text-brown-darken-4 d-flex align-center pb-2 border-b">
          <v-icon icon="mdi-shield-check-outline" color="orange-darken-2" class="mr-2"></v-icon>
          訂單明細審核與收款
        </v-card-title>
        
        <v-card-text class="pt-4 text-body-2 text-left">
          <div class="mb-4 pa-3 rounded-lg bg-orange-lighten-5 border" style="border-color: #FFE0B2 !important;">
            <div class="font-weight-bold text-brown-darken-4 text-subtitle-2 mb-1">🐾 客戶預約詳情：</div>
            <div><strong>入住毛孩：</strong> {{ selectedPendingRes?.pet_name }}</div>
            <div><strong>入住時段：</strong> {{ selectedPendingRes ? new Date(selectedPendingRes.start_time).toLocaleString() : '' }}</div>
            <div><strong>退房時段：</strong> {{ selectedPendingRes ? new Date(selectedPendingRes.end_time).toLocaleString() : '' }}</div>
            <div><strong>選用客房：</strong> {{ selectedPendingRes?.room_number ? `${selectedPendingRes.room_number}` : '無住宿（僅美容）' }}</div>
            <div><strong>選用美容：</strong> {{ selectedPendingRes?.groomer_name ? `${selectedPendingRes.groomer_name}` : '無純美容服務' }}</div>
          </div>

          <!-- 收費明細 -->
          <div class="mb-4">
            <div class="font-weight-bold text-brown-darken-4 mb-2">💵 服務費用明細：</div>
            <v-row class="px-3">
              <v-col cols="8" class="py-1">🏠 住宿費用 ({{ reviewNights }} 晚)：</v-col>
              <v-col cols="4" class="py-1 text-right font-weight-bold">${{ reviewRoomCost }}</v-col>
              
              <v-col cols="8" class="py-1">💇 美容沙龍服務費：</v-col>
              <v-col cols="4" class="py-1 text-right font-weight-bold">${{ reviewGroomingCost }}</v-col>
              
              <v-divider class="my-2"></v-divider>
              
              <v-col cols="8" class="py-1 text-subtitle-1 font-weight-bold text-orange-darken-3">💰 應收總金額：</v-col>
              <v-col cols="4" class="py-1 text-right text-subtitle-1 font-weight-bold text-orange-darken-3">${{ reviewTotalCost }}</v-col>
            </v-row>
          </div>

          <!-- 付款設定 -->
          <div class="mb-2">
            <div class="font-weight-bold text-brown-darken-4 mb-2">💳 收款登錄：</div>
            <v-row>
              <v-col cols="12" sm="6" class="py-1">
                <v-select
                  v-model="reviewPaymentMethod"
                  label="付款方式"
                  :items="['Cash', 'Card', 'LinePay', 'Transfer']"
                  :item-props="(item: any) => ({
                    title: item === 'Cash' ? '現金' : (item === 'Card' ? '信用卡' : (item === 'LinePay' ? 'LinePay' : '銀行轉帳'))
                  })"
                  variant="outlined"
                  density="compact"
                  color="orange-darken-2"
                  rounded="lg"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6" class="py-1">
                <v-select
                  v-model="reviewPaymentStatus"
                  label="付款狀態"
                  :items="['Unpaid', 'Held', 'Released']"
                  :item-props="(item: any) => ({
                    title: item === 'Unpaid' ? '❌ 未付款' : (item === 'Held' ? '🔒 託管中' : '✅ 已結清')
                  })"
                  variant="outlined"
                  density="compact"
                  color="orange-darken-2"
                  rounded="lg"
                ></v-select>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        
        <v-card-actions class="pb-4 px-4 pt-2 border-t">
          <v-btn variant="text" rounded="pill" class="font-weight-bold text-grey-darken-1" @click="reviewDialog = false">取消</v-btn>
          <v-spacer></v-spacer>
          <v-btn 
            color="success" 
            variant="flat" 
            rounded="pill" 
            class="px-6 font-weight-bold text-white"
            @click="confirmPendingOrder"
          >
            ✅ 審核無誤，確認訂單
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 餵食任務新增/編輯對話框 -->
    <v-dialog v-model="feedingTaskDialog" max-width="500px" persistent>
      <v-card rounded="xl" class="pa-4 border">
        <v-card-title class="font-weight-bold text-brown-darken-4 pb-2 border-b">
          <v-icon icon="mdi-food" color="orange-darken-2" class="mr-2"></v-icon>
          {{ isEditingTask ? '編輯餵食任務' : '新增餵食任務' }}
        </v-card-title>
        <v-card-text class="pt-4 text-left">
          <v-form @submit.prevent="submitFeedingTask">
            <!-- 預約單選取 (僅新增時) -->
            <v-select
              v-if="!isEditingTask"
              v-model="feedingTaskForm.reservation_id"
              label="選擇預約單 (進行中/已確認)"
              :items="activeReservations"
              item-title="display_label"
              item-value="id"
              variant="outlined"
              color="orange-darken-2"
              rounded="lg"
              class="mb-3"
              required
            ></v-select>

            <!-- 餵食時間 -->
            <v-text-field
              v-model="feedingTaskForm.feeding_time"
              type="datetime-local"
              label="餵食時間"
              variant="outlined"
              color="orange-darken-2"
              rounded="lg"
              class="mb-3"
              required
            ></v-text-field>

            <!-- 餵食說明 -->
            <v-textarea
              v-model="feedingTaskForm.food_info"
              label="餵食說明"
              placeholder="例如：入住乾糧一份、加生肉餅一塊"
              variant="outlined"
              color="orange-darken-2"
              rounded="lg"
              rows="3"
              class="mb-3"
              required
            ></v-textarea>

            <!-- 是否已餵食 (僅編輯時) -->
            <v-checkbox
              v-if="isEditingTask"
              v-model="feedingTaskForm.is_fed"
              label="標記為已餵食"
              color="success"
              class="mb-4"
              hide-details
            ></v-checkbox>

            <div class="d-flex justify-end pt-2">
              <v-btn variant="text" rounded="pill" color="grey-darken-1" class="font-weight-bold mr-2" @click="feedingTaskDialog = false">
                取消
              </v-btn>
              <v-btn type="submit" color="orange-darken-2" rounded="pill" class="font-weight-bold px-6 text-white">
                儲存
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 二次確認彈出框 -->
    <ConfirmDialog ref="confirmDialogRef" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import apiClient from '../api/client';
import ConfirmDialog from './ConfirmDialog.vue';

const router = useRouter();
const { mdAndUp } = useDisplay();

const headers = [
  { title: '訂單', key: 'id' },
  { title: '寵物', key: 'pet_name' },
  { title: '房號', key: 'room_number' },
  { title: '美容師', key: 'groomer_name' },
  { title: '入住時間', key: 'start_time' },
  { title: '退房時間', key: 'end_time' },
  { title: '實收金額', key: 'total_amount' },
  { title: '預約狀態', key: 'status' },
  { title: '付款狀態', key: 'payment_status' },
  { title: '操作', key: 'actions', sortable: false },
];

const reservations = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');

// Review Order references
const reviewDialog = ref(false);
const selectedPendingRes = ref<any>(null);
const reviewPaymentStatus = ref('Unpaid');
const reviewPaymentMethod = ref('Cash');

// Details Dialog references
const detailsDialog = ref(false);
const selectedRes = ref<any>(null);

// Confirm Dialog Ref
const confirmDialogRef = ref<any>(null);

// Feeding Tasks Dialog
const feedingTaskDialog = ref(false);
const isEditingTask = ref(false);
const feedingTaskForm = reactive({
  id: null as number | null,
  reservation_id: null as number | null,
  feeding_time: '',
  food_info: '',
  is_fed: false
});

// Dynamic rooms & groomers list for review cost calculation
const dbRooms = ref<any[]>([]);
const dbGroomers = ref<any[]>([]);

const openDetailsDialog = (res: any) => {
  selectedRes.value = res;
  detailsDialog.value = true;
};

const getRoomRate = (roomNumber: string) => {
  const room = dbRooms.value.find(r => r.room_number === roomNumber);
  if (room) return room.daily_rate;
  if (roomNumber?.startsWith('S')) return 400;
  if (roomNumber?.startsWith('M')) return 600;
  if (roomNumber?.startsWith('L')) return 800;
  return 0;
};

const getGroomingRate = (groomerName: string) => {
  const groomer = dbGroomers.value.find(g => g.name === groomerName);
  if (groomer) return groomer.service_rate;
  if (groomerName?.includes('Alice')) return 800;
  if (groomerName?.includes('Bob')) return 700;
  if (groomerName?.includes('Charlie')) return 500;
  if (groomerName?.includes('Diana')) return 900;
  return 600;
};

const translatePaymentMethod = (method: string) => {
  const map: Record<string, string> = {
    Cash: '現金',
    Card: '信用卡',
    LinePay: 'LinePay',
    Transfer: '轉帳'
  };
  return map[method] || method || '無';
};

const reviewNights = computed(() => {
  if (!selectedPendingRes.value) return 0;
  const start = new Date(selectedPendingRes.value.start_time);
  const end = new Date(selectedPendingRes.value.end_time);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
});

const reviewRoomCost = computed(() => {
  if (!selectedPendingRes.value || !selectedPendingRes.value.room_number) return 0;
  return getRoomRate(selectedPendingRes.value.room_number) * reviewNights.value;
});

const reviewGroomingCost = computed(() => {
  if (!selectedPendingRes.value || !selectedPendingRes.value.groomer_name) return 0;
  return getGroomingRate(selectedPendingRes.value.groomer_name);
});

const reviewTotalCost = computed(() => {
  return reviewRoomCost.value + reviewGroomingCost.value;
});

const openReviewDialog = (res: any) => {
  selectedPendingRes.value = res;
  reviewPaymentStatus.value = 'Unpaid';
  reviewPaymentMethod.value = 'Cash';
  reviewDialog.value = true;
};

const confirmPendingOrder = async () => {
  if (!selectedPendingRes.value) return;
  try {
    await apiClient.patch(`/reservations/${selectedPendingRes.value.id}/status`, {
      status: 'Confirmed',
      payment_status: reviewPaymentStatus.value,
      payment_method: reviewPaymentMethod.value
    });
    
    reviewDialog.value = false;
    refreshAllData();
  } catch (error) {
    console.error('審核確認訂單失敗:', error);
  }
};

// 退款處理 (P0-5)
const handleRefundOrder = async (item: any) => {
  const isConfirmed = await confirmDialogRef.value?.open({
    title: '↩️ 確定標記為已退款並取消？',
    message: `您確定要將訂單 (ID: ${item.id}) 標記為「已退款 (Refunded)」嗎？此操作將會同步將預約狀態變更為「已取消 (Cancelled)」。`,
    confirmText: '確認退款並取消',
    cancelText: '取消',
    confirmColor: 'blue-darken-1'
  });

  if (!isConfirmed) return;

  try {
    await apiClient.patch(`/reservations/${item.id}/status`, {
      status: 'Cancelled',
      payment_status: 'Refunded'
    });
    refreshAllData();
  } catch (error) {
    console.error('標記退款失敗:', error);
  }
};

// Date comparisons
const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
};

const isThisWeek = (dateStr: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  
  const currentDay = today.getDay();
  const diffToSunday = currentDay;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - diffToSunday);
  sunday.setHours(0, 0, 0, 0);
  
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);
  
  return date >= sunday && date <= saturday;
};

const isThisMonth = (dateStr: string) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
};

// Summary metrics
const todayCheckInsCount = computed(() => {
  return reservations.value.filter(r => isToday(r.start_time) && r.status !== 'Cancelled').length;
});

const todayCheckOutsCount = computed(() => {
  return reservations.value.filter(r => isToday(r.end_time) && r.status !== 'Cancelled').length;
});

const todayGroomingCount = computed(() => {
  return reservations.value.filter(r => isToday(r.start_time) && (r.needs_grooming === 1 || !!r.groomer_name) && r.status !== 'Cancelled').length;
});

const pendingReservationsCount = computed(() => {
  return reservations.value.filter(r => r.status === 'Pending').length;
});

const availableRoomsCount = computed(() => {
  if (stats.value?.occupancy) {
    return Math.max(0, stats.value.occupancy.total - stats.value.occupancy.occupied);
  }
  return 0;
});

// To-Do tasks for today
const todayTodoTasks = computed(() => {
  const list: any[] = [];
  feedingTasks.value.forEach(t => {
    if (isToday(t.feeding_time)) {
      if (t.needs_feeding && !t.is_fed) {
        list.push({ task: t, type: 'feeding', label: `🍽️ 餵食：${t.pet_name} (${t.food_info})` });
      }
      if (t.needs_walking && !t.walk_completed) {
        list.push({ task: t, type: 'walking', label: `👣 散步：${t.pet_name} (房號: ${t.room_number || '無'})` });
      }
      if (t.needs_medication && !t.medication_completed) {
        list.push({ task: t, type: 'medication', label: `💊 給藥：${t.pet_name} (藥歷: ${t.medical_history || '日常給藥'})` });
      }
      if (t.needs_grooming && !t.grooming_completed) {
        list.push({ task: t, type: 'grooming', label: `✂️ 美容：${t.pet_name} (美容師: ${t.groomer_name || '待指定'})` });
      }
    }
  });
  return list;
});

const handleTodoCheck = async (todoItem: any) => {
  const { task, type } = todoItem;
  let field = '';
  if (type === 'feeding') field = 'is_fed';
  if (type === 'walking') field = 'is_walked';
  if (type === 'medication') field = 'is_medicated';
  if (type === 'grooming') field = 'is_groomed';
  
  await toggleTimelineTaskItem(task, field);
};

const handleCardClick = (target: string) => {
  if (target === 'TodayCheckIns') {
    statusFilter.value = 'TodayCheckins';
    scrollToReservationsTable();
  } else if (target === 'TodayCheckOuts') {
    statusFilter.value = 'TodayCheckouts';
    scrollToReservationsTable();
  } else if (target === 'TodayGrooming') {
    statusFilter.value = 'Grooming';
    scrollToReservationsTable();
  } else if (target === 'Pending') {
    statusFilter.value = 'Pending';
    scrollToReservationsTable();
  } else if (target === 'Occupancy' || target === 'AvailableRooms') {
    router.push('/rooms');
  }
};

const scrollToReservationsTable = () => {
  const el = document.getElementById('reservations-card');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

// Status filters
const statusFilter = ref('All');
const statusFilters = [
  { label: '全部', value: 'All' },
  { label: '住宿', value: 'Room' },
  { label: '美容', value: 'Grooming' },
  { label: '待確認', value: 'Pending' },
  { label: '已確認', value: 'Confirmed' },
  { label: '已完成', value: 'Completed' },
  { label: '已取消', value: 'Cancelled' },
  { label: '今日', value: 'Today' },
  { label: '本週', value: 'Weekly' },
  { label: '本月', value: 'Monthly' }
];

const filteredReservations = computed(() => {
  let list = reservations.value;
  
  if (statusFilter.value === 'All') {
    return list;
  } else if (statusFilter.value === 'Room') {
    return list.filter((r: any) => !!r.room_number);
  } else if (statusFilter.value === 'Grooming') {
    return list.filter((r: any) => !!r.groomer_name || r.needs_grooming === 1);
  } else if (statusFilter.value === 'Pending') {
    return list.filter((r: any) => r.status?.toUpperCase() === 'PENDING');
  } else if (statusFilter.value === 'Confirmed') {
    return list.filter((r: any) => r.status?.toUpperCase() === 'CONFIRMED');
  } else if (statusFilter.value === 'Completed') {
    return list.filter((r: any) => r.status?.toUpperCase() === 'COMPLETED');
  } else if (statusFilter.value === 'Cancelled') {
    return list.filter((r: any) => r.status?.toUpperCase() === 'CANCELLED');
  } else if (statusFilter.value === 'Today') {
    return list.filter((r: any) => isToday(r.start_time) || isToday(r.end_time));
  } else if (statusFilter.value === 'Weekly') {
    return list.filter((r: any) => isThisWeek(r.start_time) || isThisWeek(r.end_time));
  } else if (statusFilter.value === 'Monthly') {
    return list.filter((r: any) => isThisMonth(r.start_time) || isThisMonth(r.end_time));
  } else if (statusFilter.value === 'TodayCheckins') {
    return list.filter((r: any) => isToday(r.start_time));
  } else if (statusFilter.value === 'TodayCheckouts') {
    return list.filter((r: any) => isToday(r.end_time));
  }
  
  return list;
});

// 篩選進行中預約（用於新增餵食任務下拉選單）
const activeReservations = computed(() => {
  return reservations.value
    .filter((r: any) => r.status === 'Confirmed' || r.status === 'Pending')
    .map((r: any) => ({
      id: r.id,
      display_label: `單號 ${r.id} - ${r.pet_name} (房號: ${r.room_number || '無'})`
    }));
});

const fetchReservations = async (setLoadingState = false) => {
  if (setLoadingState) loading.value = true;
  try {
    const res = await apiClient.get('/reservations');
    reservations.value = res.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
  } finally {
    if (setLoadingState) loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = { PENDING: 'warning', CONFIRMED: 'success', CANCELLED: 'error', COMPLETED: 'grey-darken-1' };
  return map[status?.toUpperCase()] || 'grey';
};

const getPaymentColor = (paymentStatus: string) => {
  const map: Record<string, string> = {
    Unpaid: 'red-darken-1',
    Held: 'orange-darken-2',
    Released: 'green-darken-2',
    Refunded: 'blue-darken-1'
  };
  return map[paymentStatus] || 'grey';
};

const getPaymentLabel = (paymentStatus: string) => {
  const map: Record<string, string> = {
    Unpaid: '💳 未付款',
    Held: '🔒 託管中',
    Released: '✅ 已結清',
    Refunded: '↩️ 已退款'
  };
  return map[paymentStatus] || '💳 未付款';
};

const changeStatus = async (id: number, newStatus: string) => {
  try {
    await apiClient.patch(`/reservations/${id}/status`, { status: newStatus });
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
    const res = await apiClient.get('/reservations/stats');
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

// Care Tasks / Feeding Section
const feedingTasks = ref<any[]>([]);
const taskFilter = ref('All');

const fetchFeedingTasks = async () => {
  try {
    const res = await apiClient.get('/reservations/feeding');
    feedingTasks.value = res.data;
  } catch (error) {
    console.error('Error fetching feeding tasks:', error);
  }
};

const filteredGroupedTasks = computed(() => {
  const filtered = feedingTasks.value.filter(task => {
    if (taskFilter.value === 'Pending') return !task.is_fed;
    if (taskFilter.value === 'Warning') return !!task.medical_history;
    return true;
  });

  const groups: Record<string, any[]> = {};
  
  filtered.forEach(task => {
    const dateObj = new Date(task.feeding_time);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(task);
  });

  return Object.keys(groups).sort().map(date => ({ date: date, tasks: groups[date] }));
});

const toggleCareItem = async (task: any, field: string) => {
  try {
    const resId = task.reservation_id || task.id;
    const currentValue = task[field];
    const newValue = currentValue ? 0 : 1;
    
    await apiClient.patch(`/reservations/${resId}/status`, {
      [field]: newValue
    });
    
    // Sync state in UI
    feedingTasks.value.forEach((t: any) => {
      if ((t.reservation_id || t.id) === resId) {
        t[field] = newValue;
      }
    });

    if (selectedRes.value && selectedRes.value.id === resId) {
      selectedRes.value[field] = newValue;
    }
    
    const foundRes = reservations.value.find((r: any) => r.id === resId);
    if (foundRes) {
      foundRes[field] = newValue;
    }

    fetchStats();
  } catch (error) {
    console.error('Error toggling care item:', error);
  }
};

const toggleTimelineTaskItem = async (task: any, field: string) => {
  try {
    let key = '';
    let currentValue = 0;
    if (field === 'is_fed') {
      key = 'is_fed';
      currentValue = task.is_fed ? 1 : 0;
    } else if (field === 'is_walked') {
      key = 'is_walked';
      currentValue = task.walk_completed ? 1 : 0;
    } else if (field === 'is_medicated') {
      key = 'is_medicated';
      currentValue = task.medication_completed ? 1 : 0;
    } else if (field === 'is_groomed') {
      key = 'is_groomed';
      currentValue = task.grooming_completed ? 1 : 0;
    }

    const newValue = currentValue ? 0 : 1;
    await apiClient.patch(`/reservations/feeding/${task.id}`, {
      [key]: newValue
    });
    
    if (field === 'is_fed') task.is_fed = newValue;
    if (field === 'is_walked') task.walk_completed = newValue;
    if (field === 'is_medicated') task.medication_completed = newValue;
    if (field === 'is_groomed') task.grooming_completed = newValue;
    
    fetchFeedingTasks();
    fetchStats();
  } catch (error) {
    console.error('Error toggling timeline task item:', error);
  }
};

// 餵食任務新增與編輯 Dialog 控制
const openAddFeedingTaskDialog = (dateStr: string) => {
  isEditingTask.value = false;
  feedingTaskForm.id = null;
  const activeRes = reservations.value.filter((r: any) => r.status === 'Confirmed' || r.status === 'Pending');
  feedingTaskForm.reservation_id = activeRes.length > 0 ? activeRes[0].id : null;
  feedingTaskForm.feeding_time = `${dateStr}T12:00`;
  feedingTaskForm.food_info = '入住套房乾糧一份';
  feedingTaskForm.is_fed = false;
  feedingTaskDialog.value = true;
};

const openEditFeedingTaskDialog = (task: any) => {
  isEditingTask.value = true;
  feedingTaskForm.id = task.id;
  feedingTaskForm.reservation_id = task.reservation_id;
  
  const d = new Date(task.feeding_time);
  const pad = (n: number) => String(n).padStart(2, '0');
  const dStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  
  feedingTaskForm.feeding_time = dStr;
  feedingTaskForm.food_info = task.food_info;
  feedingTaskForm.is_fed = !!task.is_fed;
  feedingTaskDialog.value = true;
};

const submitFeedingTask = async () => {
  if (!feedingTaskForm.reservation_id || !feedingTaskForm.feeding_time || !feedingTaskForm.food_info) return;
  try {
    const safeTime = feedingTaskForm.feeding_time.replace('T', ' ');
    if (isEditingTask.value && feedingTaskForm.id) {
      await apiClient.put(`/reservations/feeding/${feedingTaskForm.id}`, {
        food_info: feedingTaskForm.food_info,
        feeding_time: safeTime,
        is_fed: feedingTaskForm.is_fed
      });
    } else {
      await apiClient.post('/reservations/feeding', {
        reservation_id: feedingTaskForm.reservation_id,
        feeding_time: safeTime,
        food_info: feedingTaskForm.food_info
      });
    }
    feedingTaskDialog.value = false;
    refreshAllData();
  } catch (error) {
    console.error('Error saving feeding task:', error);
  }
};

const isAllCompleted = (task: any) => {
  if (task.needs_feeding && !task.fed_completed) return false;
  if (task.needs_walking && !task.walk_completed) return false;
  if (task.needs_medication && !task.medication_completed) return false;
  if (task.needs_grooming && !task.grooming_completed) return false;
  return true;
};

// 載入房間與美容師以計算費用
const loadPricingResources = async () => {
  try {
    const roomRes = await apiClient.get('/resources/rooms');
    dbRooms.value = roomRes.data;
    const groomerRes = await apiClient.get('/resources/groomers');
    dbGroomers.value = groomerRes.data;
  } catch (error) {
    console.error('Failed to load dynamic pricing resources:', error);
  }
};

const refreshAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      fetchReservations(false),
      fetchFeedingTasks(),
      fetchStats(),
      loadPricingResources()
    ]);
  } catch (error) {
    console.error('Failed to refresh dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refreshAllData();
  window.addEventListener('reservation-created', refreshAllData);
  window.addEventListener('logo-refresh', refreshAllData);
});

onUnmounted(() => {
  window.removeEventListener('reservation-created', refreshAllData);
  window.removeEventListener('logo-refresh', refreshAllData);
});
</script>

<style scoped>
/* Scrollbar styling */
.agenda-scroll-container {
  max-height: 550px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
}

.agenda-scroll-container::-webkit-scrollbar {
  width: 6px;
}
.agenda-scroll-container::-webkit-scrollbar-track {
  background: #FFF8E1; 
  border-radius: 8px;
}
.agenda-scroll-container::-webkit-scrollbar-thumb {
  background: #FFB74D; 
  border-radius: 8px;
}
.agenda-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #FF9800; 
}

/* Pulsing alert animation for high-risk pets */
@keyframes risk-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(239, 83, 80, 0); }
}
.risk-card-high {
  animation: risk-pulse 2s infinite;
}

.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}

/* Glassmorphism subtle styles */
.glass-card-blue, .glass-card-orange, .glass-card-green {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.glass-card-blue:hover, .glass-card-orange:hover, .glass-card-green:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(109, 76, 65, 0.12) !important;
}
</style>