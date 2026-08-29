import api from './axios';
import type { Transaction, TransactionPayload, TransactionFilters } from '../types/TransactionApi';

export async function fetchTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data } = await api.get('/transactions', { params });
  return data.transactions;
}

export async function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  const { data } = await api.post('/transactions', payload);
  return data.transaction;
}

export async function updateTransaction(id: string, payload: Partial<TransactionPayload>): Promise<Transaction> {
  const { data } = await api.patch(`/transactions/${id}`, payload);
  return data.transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}