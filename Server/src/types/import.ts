export interface RawCsvRow {
  [header: string]: string;
}

export type ImportSessionStatus = 'mapping_pending' | 'reviewing';

export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  typeColumn?: string;     // NEW
  debitValue?: string;     // NEW
  creditValue?: string;    // NEW
}

export interface StagedImportRow {
  id: string;
  date: string;              // YYYY-MM-DD
  description: string;
  amount: number;            // always positive
  type: 'income' | 'expense';
  categoryId: string | null;
  excluded: boolean;
  possibleDuplicate: boolean;
  rawSource: RawCsvRow | null;
}

export interface ImportSession {
  workspaceId: string;
  sourceType: 'csv' | 'pdf';
  fileName: string;
  status: ImportSessionStatus;
  headers: string[];
  rawRows: RawCsvRow[];      // cleared once mapping is confirmed
  mapping: ColumnMapping | null;
  stagedRows: StagedImportRow[];
  createdAt: string;
}


