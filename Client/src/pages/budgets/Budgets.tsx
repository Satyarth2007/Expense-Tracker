import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '../../hooks/useBudgets';
import BudgetModal from '../../components/budgets/BudgetModal';
import type { Budget, BudgetPayload } from '../../types/BudgetApi';
import type { ApiErrorResponse } from '../../context/AuthContext';

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

function formatINR(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function meterColor(percentUsed: number, thresholdPct: number): string {
  if (percentUsed >= 100) return 'var(--color-red)';
  if (percentUsed >= thresholdPct) return 'var(--color-brass)';
  return 'var(--color-green-2)';
}

type ModalState = { mode: 'create' } | { mode: 'edit'; budget: Budget } | null;

export default function Budgets() {
  const { data: budgets, isLoading, isError } = useBudgets();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  async function handleModalSubmit(payload: BudgetPayload) {
    setModalError(null);
    try {
      if (modalState?.mode === 'edit') {
        const { categoryId, ...rest } = payload;
        await updateMutation.mutateAsync({ id: modalState.budget.id, payload: rest });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setModalState(null);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this budget? You can set a new one for this category anytime.')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert(getErrorMessage(err, 'Could not remove this budget.'));
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="text-ink-soft">Loading budgets…</div>;
  }

  if (isError) {
    return <div className="text-red">Could not load budgets. Please refresh.</div>;
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
        Monthly limits
        <span className="flex-1 h-px bg-rule" />
      </div>
      <div className="flex items-baseline justify-between flex-wrap gap-3.5 mb-8">
        <div>
          <h1 className="text-[34px] font-semibold text-ink">Budgets</h1>
          <p className="text-ink-soft mt-1.5 text-[15px] max-w-[520px]">
            Set a ceiling per category — Ledger tracks it in real time as entries land.
          </p>
        </div>
        <button
          onClick={() => setModalState({ mode: 'create' })}
          className="inline-flex items-center gap-2 px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper
                     text-[14px] font-semibold hover:-translate-y-[2px] hover:shadow-lg transition-transform"
        >
          + New budget
        </button>
      </div>

      {(!budgets || budgets.length === 0) ? (
        <div className="border-[1.5px] border-dashed border-rule rounded-md py-16 text-center text-ink-soft">
          <p className="text-[14px] mb-3">No budgets set yet.</p>
          <button
            onClick={() => setModalState({ mode: 'create' })}
            className="text-green font-semibold text-[13.5px]"
          >
            + Set your first budget
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {budgets.map((b) => {
            const color = meterColor(b.percent_used, b.alert_threshold_pct);
            const widthPct = Math.min(b.percent_used, 100);
            const isOver = b.percent_used >= 100;
            const remaining = Number(b.remaining_amount);

            return (
              <div
                key={b.id}
                className="group bg-paper-2 border border-rule-soft rounded-md p-5"
              >
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-semibold text-[15px] text-ink">
                    {b.category_icon ?? '🏷️'} {b.category_name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] text-ink-soft">
                      {formatINR(b.spent_amount)} / {formatINR(b.limit_amount)}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => setModalState({ mode: 'edit', budget: b })}
                        className="text-ink-faint hover:text-ink text-[12px] px-1.5 py-0.5"
                        aria-label={`Edit ${b.category_name} budget`}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="text-ink-faint hover:text-red text-[12px] px-1.5 py-0.5"
                        aria-label={`Delete ${b.category_name} budget`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-[9px] bg-paper-3 rounded-[5px] overflow-hidden">
                  <div
                    className="h-full rounded-[5px] transition-[width] duration-500"
                    style={{ width: `${widthPct}%`, background: color }}
                  />
                </div>

                <div
                  className="text-[12.5px] mt-2"
                  style={{ color: isOver ? 'var(--color-red)' : 'var(--color-ink-soft)' }}
                >
                  {isOver
                    ? `Over by ${formatINR(Math.abs(remaining))} — consider reviewing next ${b.period.replace('ly', '')}'s budget.`
                    : `${b.percent_used}% used · ${formatINR(remaining)} remaining this ${b.period.replace('ly', '')}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalState && (
        <BudgetModal
          mode={modalState.mode}
          initial={modalState.mode === 'edit' ? modalState.budget : null}
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