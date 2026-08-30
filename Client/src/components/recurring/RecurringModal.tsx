import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useCategories } from '../../hooks/useCategories';
import type { RecurringRule, RecurringRulePayload, RecurringFrequency } from '../../types/RecurringApi';

interface RecurringModalProps {
  mode: 'create' | 'edit';
  initial?: RecurringRule | null;
  onClose: () => void;
  onSubmit: (payload: RecurringRulePayload) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export default function RecurringModal({
  mode,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: RecurringModalProps) {
  const { data: categories } = useCategories();
  const expenseCategories = useMemo(
    () => (categories ?? []).filter((c) => c.type === 'expense'),
    [categories]
  );

  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState(
    toDateInput(initial?.start_date) || new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(toDateInput(initial?.end_date));

  useEffect(() => {
    setCategoryId(initial?.category_id ?? '');
    setName(initial?.name ?? '');
    setAmount(initial?.amount ?? '');
    setFrequency(initial?.frequency ?? 'monthly');
    setStartDate(toDateInput(initial?.start_date) || new Date().toISOString().slice(0, 10));
    setEndDate(toDateInput(initial?.end_date));
  }, [initial]);

  const parsedAmount = Number(amount);
  const isValid =
    name.trim() !== '' &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    startDate !== '' &&
    (endDate === '' || endDate >= startDate);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    await onSubmit({
      categoryId: categoryId || undefined,
      name: name.trim(),
      amount: parsedAmount,
      frequency,
      startDate,
      endDate: endDate || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-paper border border-rule-soft rounded-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2">
          {mode === 'create' ? 'New rule' : 'Edit rule'}
        </div>
        <h2 className="text-[22px] font-semibold text-ink mb-5">
          {mode === 'create' ? 'Set a recurring transaction' : initial?.name ?? 'Edit rule'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Rent — Aug apartment"
              required
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-wash)]"
            />
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
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
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
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                disabled={isSubmitting}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                End date (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
                min={startDate}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              />
            </div>
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
              disabled={isSubmitting || !isValid}
              className="px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper text-[14px] font-semibold
                         hover:-translate-y-[2px] hover:shadow-lg transition-transform
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}