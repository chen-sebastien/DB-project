<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" lg="10">
        <v-card elevation="3" rounded="xl" class="border" style="border-color: #FFCC80 !important; overflow: hidden;">
          <v-card-title class="bg-orange-lighten-4 text-brown-darken-4 font-weight-bold py-4 px-6">
            <v-icon icon="mdi-calendar-plus" class="mr-2" color="orange-darken-3"></v-icon>
            奢華度假村預約中心
          </v-card-title>
          <v-card-text class="pt-6 px-6">
            <ReservationForm />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ReservationForm from '../components/ReservationForm.vue';
</script>
