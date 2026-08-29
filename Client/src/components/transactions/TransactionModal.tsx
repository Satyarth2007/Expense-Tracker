import { useEffect, useState, type FormEvent } from 'react';
import { useCategories } from '../../hooks/useCategories';
import type { Transaction, TransactionPayload } from '../../types/TransactionApi';

interface TransactionModalProps {
  mode: 'create' | 'edit';
  initial?: Transaction | null;
  onClose: () => void;
  onSubmit: (payload: TransactionPayload) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export default function TransactionModal({
  mode,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: TransactionModalProps) {
  const { data: categories } = useCategories();

  const [merchant, setMerchant] = useState(initial?.merchant ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(initial?.type ?? 'expense');
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [transactionDate, setTransactionDate] = useState(
    initial?.transaction_date ?? new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    setMerchant(initial?.merchant ?? '');
    setAmount(initial?.amount ?? '');
    setType(initial?.type ?? 'expense');
    setCategoryId(initial?.category_id ?? '');
    setDescription(initial?.description ?? '');
    setTransactionDate(initial?.transaction_date ?? new Date().toISOString().slice(0, 10));
  }, [initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      merchant: merchant.trim() || null,
      amount: Number(amount),
      type,
      categoryId: categoryId || null,
      description: description.trim() || null,
      transactionDate,
    });
  }

  const parents = (categories ?? []).filter((c) => c.parent_id === null);
  const children = (categories ?? []).filter((c) => c.parent_id !== null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-paper border border-rule-soft rounded-md p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2">
          {mode === 'create' ? 'New entry' : 'Edit entry'}
        </div>
        <h2 className="text-[22px] font-semibold text-ink mb-5">
          {mode === 'create' ? 'Add transaction' : merchant || 'Edit transaction'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Merchant / description
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Big Bazaar"
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-wash)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'income' | 'expense' | 'transfer')}
                disabled={isSubmitting}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green"
            >
              <option value="">No category</option>
              {parents.map((parent) => (
                <optgroup key={parent.id} label={`${parent.icon ?? ''} ${parent.name}`}>
                  <option value={parent.id}>{parent.name} (general)</option>
                  {children
                    .filter((c) => c.parent_id === parent.id)
                    .map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.icon ?? ''} {child.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Date
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green"
            />
          </div>

          <div className="mb-5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Notes (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green"
            />
          </div>

          {error && (
            <div className="text-red text-[13px] mb-4" role="alert">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-[11px] rounded-[3px] border border-rule text-ink text-[14px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || Number(amount) <= 0}
              className="px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper text-[14px] font-semibold
                         hover:-translate-y-[2px] hover:shadow-lg transition-transform
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Add entry' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}