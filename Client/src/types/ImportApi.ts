export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  typeColumn?: string;
  debitValue?: string;
  creditValue?: string;
}

export interface UploadResponse {
  sessionId: string;
  fileName: string;
  headers: string[];
  guessedMapping: Partial<ColumnMapping>;
  previewRows: Record<string, string>[];
  totalRows: number;
}

export interface StagedImportRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string | null;
  excluded: boolean;
  possibleDuplicate: boolean;
  rawSource: Record<string, string> | null;
}

export interface ConfirmMappingResponse {
  sessionId: string;
  stagedRows: StagedImportRow[];
  skippedCount: number;
}

export interface ImportSessionResponse {
  sessionId: string;
  status: 'mapping_pending' | 'reviewing';
  fileName: string;
  headers: string[];
  stagedRows: StagedImportRow[];
}

export interface StagedRowUpdatePayload {
  date?: string;
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  categoryId?: string | null;
  excluded?: boolean;
}