import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios'; // adjust path to match where your axios instance actually lives
import type { Budget, BudgetPayload, BudgetUpdatePayload } from '../types/BudgetApi';

const BUDGETS_KEY = ['budgets'] as const;

export function useBudgets(includeInactive = false) {
  return useQuery({
    queryKey: [...BUDGETS_KEY, { includeInactive }],
    queryFn: async () => {
      const { data } = await api.get<{ budgets: Budget[] }>('/budgets', {
        params: { includeInactive },
      });
      return data.budgets;
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BudgetPayload) => {
      const { data } = await api.post<{ budget: Budget }>('/budgets', payload);
      return data.budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: BudgetUpdatePayload }) => {
      const { data } = await api.patch<{ budget: Budget }>(`/budgets/${id}`, payload);
      return data.budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY });
    },
  });
}