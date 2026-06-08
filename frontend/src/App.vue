<template>
  <v-app>
    <v-app-bar color="orange-darken-2" elevation="3">
      <v-icon icon="mdi-paw" class="ml-4 mr-2"></v-icon>
      <v-app-bar-title class="font-weight-bold">寵物友善旅館服務管理系統</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="mb-4 border" elevation="3" rounded="xl" style="border-color: #FFCC80 !important; overflow: hidden;">
              <v-card-title class="bg-orange-lighten-4 text-brown-darken-4 font-weight-bold py-3">
                <v-icon icon="mdi-calendar-plus" class="mr-2"></v-icon>
                新增預約
              </v-card-title>
              <v-card-text class="pt-4">
                <ReservationForm />
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card elevation="3" rounded="xl" class="border" style="border-color: #D7CCC8 !important; overflow: hidden;">
              <v-card-title class="bg-brown-lighten-4 text-brown-darken-4 font-weight-bold py-3">
                <v-icon icon="mdi-monitor-dashboard" class="mr-2"></v-icon>
                預約紀錄管理
              </v-card-title>
              <v-card-text class="pt-4">
                <Dashboard />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import ReservationForm from './components/ReservationForm.vue';
import Dashboard from './components/Dashboard.vue';
</script>

<style scoped>
.v-main {
  /* 4. 將背景換成非常淡的暖米色，讓整體視覺更柔和溫馨 */
  background-color: #FFF8E1; 
}
</style>