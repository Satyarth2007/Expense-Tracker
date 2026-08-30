import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { RecurringRule, RecurringRulePayload, RecurringRuleUpdatePayload } from '../types/RecurringApi';

const RECURRING_KEY = ['recurring'] as const;

export function useRecurringRules() {
  return useQuery({
    queryKey: RECURRING_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ recurringRules: RecurringRule[] }>('/recurring');
      return data.recurringRules;
    },
  });
}

export function useCreateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecurringRulePayload) => {
      const { data } = await api.post<{ recurringRule: RecurringRule }>('/recurring', payload);
      return data.recurringRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEY });
    },
  });
}

export function useUpdateRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RecurringRuleUpdatePayload }) => {
      const { data } = await api.patch<{ recurringRule: RecurringRule }>(`/recurring/${id}`, payload);
      return data.recurringRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEY });
    },
  });
}

export function useDeleteRecurringRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recurring/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEY });
    },
  });
}