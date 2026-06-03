<template>
  <v-app>
    <v-app-bar title="寵物友善旅館服務管理系統" color="primary"></v-app-bar>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="mb-4" elevation="2">
              <v-card-title class="bg-primary text-white">新增預約</v-card-title>
              <ReservationForm />
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card elevation="2">
              <v-card-title class="bg-secondary text-white">預約紀錄管理</v-card-title>
              <Dashboard />
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
  background-color: #f5f5f5;
}
</style>
