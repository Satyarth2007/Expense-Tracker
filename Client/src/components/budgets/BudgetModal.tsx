import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useCategories } from '../../hooks/useCategories';
import type { Budget, BudgetPayload, BudgetPeriod } from '../../types/BudgetApi';

interface BudgetModalProps {
  mode: 'create' | 'edit';
  initial?: Budget | null;
  onClose: () => void;
  onSubmit: (payload: BudgetPayload) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function BudgetModal({
  mode,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: BudgetModalProps) {
  const { data: categories } = useCategories();
  const expenseCategories = useMemo(
    () => (categories ?? []).filter((c) => c.type === 'expense'),
    [categories]
  );

  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [limitAmount, setLimitAmount] = useState(initial?.limit_amount ?? '');
  const [period, setPeriod] = useState<BudgetPeriod>(initial?.period ?? 'monthly');
  const [alertThresholdPct, setAlertThresholdPct] = useState(
    initial?.alert_threshold_pct?.toString() ?? '80'
  );

  useEffect(() => {
    setCategoryId(initial?.category_id ?? '');
    setLimitAmount(initial?.limit_amount ?? '');
    setPeriod(initial?.period ?? 'monthly');
    setAlertThresholdPct(initial?.alert_threshold_pct?.toString() ?? '80');
  }, [initial]);

  const parsedLimit = Number(limitAmount);
  const parsedThreshold = Number(alertThresholdPct);
  const isValid =
    categoryId !== '' &&
    Number.isFinite(parsedLimit) &&
    parsedLimit > 0 &&
    Number.isInteger(parsedThreshold) &&
    parsedThreshold >= 1 &&
    parsedThreshold <= 100;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    await onSubmit({
      categoryId,
      limitAmount: parsedLimit,
      period,
      alertThresholdPct: parsedThreshold,
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
          {mode === 'create' ? 'New budget' : 'Edit budget'}
        </div>
        <h2 className="text-[22px] font-semibold text-ink mb-5">
          {mode === 'create' ? 'Set a budget' : initial?.category_name ?? 'Edit budget'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting || mode === 'edit'}
              required
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green disabled:opacity-60"
            >
              <option value="" disabled>Select a category…</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </option>
              ))}
            </select>
            {mode === 'edit' && (
              <p className="text-[11.5px] text-ink-faint mt-1.5">
                Category can't be changed after creation — delete and recreate instead.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Limit amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
                disabled={isSubmitting}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              >
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Alert threshold (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={alertThresholdPct}
              onChange={(e) => setAlertThresholdPct(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green"
            />
            <p className="text-[11.5px] text-ink-faint mt-1.5">
              We'll flag this budget once spending crosses this percentage.
            </p>
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