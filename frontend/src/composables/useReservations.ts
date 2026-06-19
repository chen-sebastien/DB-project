import { ref } from 'vue';
import apiClient from '../api/client';

export function useReservations() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const changeStatus = async (
    id: number,
    payload: {
      status?: string;
      payment_status?: string;
      payment_method?: string;
      fed_completed?: boolean;
      walk_completed?: boolean;
      medication_completed?: boolean;
      grooming_completed?: boolean;
    }
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiClient.patch(`/reservations/${id}/status`, payload);
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || '更新預約狀態失敗';
      error.value = msg;
      throw new Error(msg);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    changeStatus,
  };
}
