import { useMutation } from '@tanstack/react-query';
import api from '../lib/axios';
import type { ExportType } from '../types/ReportApi';

interface ExportParams {
  type: ExportType;
  from: string;
  to: string;
}

function extensionFor(type: ExportType): string {
  if (type === 'pdf') return 'pdf';
  return 'csv';
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({ type, from, to }: ExportParams) => {
      const response = await api.get('/reports/export', {
        params: { type, from, to },
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${from}-to-${to}.${extensionFor(type)}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}