import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import type { DashboardSummary } from '../types/DashboardApi';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>('/dashboard/summary');
      return data;
    },
  });
}