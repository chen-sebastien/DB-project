<template>
  <v-dialog v-model="visible" max-width="450px" persistent>
    <v-card class="glass-card" rounded="xl" elevation="10">
      <v-card-title class="d-flex align-center font-weight-bold text-brown-darken-4 pt-5 px-6">
        <v-icon :color="iconColor" :icon="icon" class="mr-3" size="28"></v-icon>
        {{ title }}
      </v-card-title>
      
      <v-card-text class="text-body-1 text-grey-darken-3 px-6 py-4">
        {{ message }}
      </v-card-text>
      
      <v-card-actions class="px-6 pb-5 pt-2 justify-end">
        <v-btn
          color="grey-darken-1"
          variant="text"
          class="font-weight-bold rounded-lg px-4"
          @click="cancel"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="flat"
          class="font-weight-bold rounded-lg px-5 ml-2"
          @click="confirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);
const title = ref('確認操作');
const message = ref('您確定要執行此操作嗎？');
const confirmText = ref('確定');
const cancelText = ref('取消');
const confirmColor = ref('primary');
const iconColor = ref('warning');
const icon = ref('mdi-alert-circle');

let resolvePromise: (value: boolean) => void;

const open = (options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  iconColor?: string;
  icon?: string;
}) => {
  title.value = options.title;
  message.value = options.message;
  confirmText.value = options.confirmText || '確定';
  cancelText.value = options.cancelText || '取消';
  confirmColor.value = options.confirmColor || 'primary';
  iconColor.value = options.iconColor || 'warning';
  icon.value = options.icon || 'mdi-alert-circle';
  visible.value = true;
  
  return new Promise<boolean>((resolve) => {
    resolvePromise = resolve;
  });
};

const confirm = () => {
  visible.value = false;
  resolvePromise(true);
};

const cancel = () => {
  visible.value = false;
  resolvePromise(false);
};

defineExpose({
  open
});
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
</style>
