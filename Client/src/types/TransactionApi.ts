export interface Transaction {
  id: string;
  category_id: string | null;
  merchant: string | null;
  amount: string; // numeric comes back as string from pg — parse with Number() when displaying
  currency: string;
  type: 'income' | 'expense' | 'transfer';
  description: string | null;
  transaction_date: string; // "YYYY-MM-DD"
  source: 'manual' | 'csv_import' | 'pdf_import' | 'recurring' | 'plaid';
  created_at: string;
  updated_at: string;
}

export interface TransactionPayload {
  categoryId?: string | null;
  merchant?: string | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description?: string | null;
  transactionDate: string; // "YYYY-MM-DD"
}

export interface TransactionFilters {
  categoryId?: string;
  type?: 'income' | 'expense' | 'transfer';
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}