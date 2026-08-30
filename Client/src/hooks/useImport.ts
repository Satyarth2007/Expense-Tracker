import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type {
  UploadResponse,
  ConfirmMappingResponse,
  ImportSessionResponse,
  ColumnMapping,
  StagedRowUpdatePayload,
} from '../types/ImportApi';

export function useUploadImportFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<UploadResponse>('/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
  });
}

export function useConfirmMapping() {
  return useMutation({
    mutationFn: async ({ sessionId, mapping }: { sessionId: string; mapping: ColumnMapping }) => {
      const { data } = await api.post<ConfirmMappingResponse>(
        `/import/${sessionId}/confirm-mapping`,
        mapping
      );
      return data;
    },
  });
}

export function useImportSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['import', sessionId],
    queryFn: async () => {
      const { data } = await api.get<ImportSessionResponse>(`/import/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useUpdateStagedRow(sessionId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rowId, payload }: { rowId: string; payload: StagedRowUpdatePayload }) => {
      const { data } = await api.patch(`/import/${sessionId}/rows/${rowId}`, payload);
      return data.row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import', sessionId] });
    },
  });
}

export function useCommitImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.post(`/import/${sessionId}/commit`);
      return data as { message: string; importedCount: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDiscardImport() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.delete(`/import/${sessionId}`);
      return data;
    },
  });
}