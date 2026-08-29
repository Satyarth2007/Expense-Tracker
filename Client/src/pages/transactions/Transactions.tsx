import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import TransactionModal from '../../components/transactions/TransactionModal';
import type { Transaction, TransactionPayload } from '../../types/TransactionApi';
import type { ApiErrorResponse } from '../../context/AuthContext';

type FilterType = 'all' | 'income' | 'expense';

function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(err) && err.response) {
    const { error } = err.response.data;
    if (typeof error === 'string') return error;
    const firstFieldError = Object.values(error.fieldErrors).flat()[0];
    if (firstFieldError) return firstFieldError;
    if (error.formErrors[0]) return error.formErrors[0];
  }
  return fallback;
}

function formatAmount(amount: string) {
  return Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
}

type ModalState = { mode: 'create' } | { mode: 'edit'; transaction: Transaction } | null;

export default function Transactions() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const { data: transactions, isLoading, isError } = useTransactions({
    type: filterType === 'all' ? undefined : filterType,
    search: search || undefined,
  });
  const { data: categories } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const categoryById = useMemo(() => {
    const map = new Map<string, { name: string; icon: string | null }>();
    (categories ?? []).forEach((c) => map.set(c.id, { name: c.name, icon: c.icon }));
    return map;
  }, [categories]);

  async function handleModalSubmit(payload: TransactionPayload) {
    setModalError(null);
    try {
      if (modalState?.mode === 'edit') {
        await updateMutation.mutateAsync({ id: modalState.transaction.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setModalState(null);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete this transaction.'));
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
        Ledger entries
        <span className="flex-1 h-px bg-rule" />
      </div>
      <div className="flex items-baseline justify-between flex-wrap gap-3.5 mb-8">
        <div>
          <h1 className="text-[34px] font-semibold text-ink">Transactions</h1>
          <p className="text-ink-soft mt-1.5 text-[15px] max-w-[520px]">
            Every entry, from every source — manual, imported, or recurring.
          </p>
        </div>
        <button
          onClick={() => setModalState({ mode: 'create' })}
          className="inline-flex items-center gap-2 px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper
                     text-[14px] font-semibold hover:-translate-y-[2px] hover:shadow-lg transition-transform"
        >
          + New entry
        </button>
      </div>

      <div className="flex gap-2.5 mb-4.5 flex-wrap items-center">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 border border-rule bg-paper-2 rounded-md px-3 py-2.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint flex-shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by merchant or note…"
            className="flex-1 bg-transparent border-none text-[14px] text-ink focus:outline-none"
          />
        </div>
        {(['all', 'income', 'expense'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-[13px] py-[7px] rounded-full text-[12.5px] border transition-colors ${
              filterType === f
                ? 'bg-green text-white border-green'
                : 'bg-paper-2 text-ink-soft border-rule'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-paper-2 border border-rule-soft rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-ink-soft text-[14px]">Loading transactions…</div>
        ) : isError ? (
          <div className="p-6 text-red text-[14px]">Could not load transactions. Please refresh.</div>
        ) : (transactions ?? []).length === 0 ? (
          <div className="p-6 text-ink-soft text-[14px]">No transactions yet — add your first entry above.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-2.5 border-b-[1.5px] border-ink">
                  Date
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-2.5 border-b-[1.5px] border-ink">
                  Description
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-2.5 border-b-[1.5px] border-ink">
                  Category
                </th>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-2.5 border-b-[1.5px] border-ink">
                  Source
                </th>
                <th className="text-right font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-2.5 border-b-[1.5px] border-ink">
                  Amount
                </th>
                <th className="px-3 pb-2.5 border-b-[1.5px] border-ink" />
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((txn) => {
                const category = txn.category_id ? categoryById.get(txn.category_id) : null;
                const isPositive = txn.type === 'income';
                return (
                  <tr key={txn.id} className="group hover:bg-paper-3 transition-colors">
                    <td className="px-3 py-3.5 border-b border-rule-soft font-mono text-[14px] text-ink">
                      {formatDate(txn.transaction_date)}
                    </td>
                    <td className="px-3 py-3.5 border-b border-rule-soft text-[14px] text-ink">
                      {txn.merchant || txn.description || '—'}
                    </td>
                    <td className="px-3 py-3.5 border-b border-rule-soft">
                      {category ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] bg-paper-3">
                          {category.icon} {category.name}
                        </span>
                      ) : (
                        <span className="text-ink-faint text-[12px]">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 border-b border-rule-soft font-mono text-[12px] text-ink-faint capitalize">
                      {txn.source.replace('_', ' ')}
                    </td>
                    <td
                      className={`px-3 py-3.5 border-b border-rule-soft text-right font-mono font-semibold text-[13.5px] ${
                        isPositive ? 'text-green' : 'text-red'
                      }`}
                    >
                      {isPositive ? '+' : '−'}₹{formatAmount(txn.amount)}
                    </td>
                    <td className="px-3 py-3.5 border-b border-rule-soft">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
                        <button
                          onClick={() => setModalState({ mode: 'edit', transaction: txn })}
                          className="text-ink-faint hover:text-ink text-[12px] px-1.5"
                          aria-label="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="text-ink-faint hover:text-red text-[12px] px-1.5"
                          aria-label="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalState && (
        <TransactionModal
          mode={modalState.mode}
          initial={modalState.mode === 'edit' ? modalState.transaction : null}
          onClose={() => {
            setModalState(null);
            setModalError(null);
          }}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
          error={modalError}
        />
      )}
    </div>
  );
}