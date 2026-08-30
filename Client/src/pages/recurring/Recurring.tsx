import { useState } from 'react';
import { isAxiosError } from 'axios';
import {
  useRecurringRules,
  useCreateRecurringRule,
  useUpdateRecurringRule,
  useDeleteRecurringRule,
} from '../../hooks/useRecurring';
import RecurringModal from '../../components/recurring/RecurringModal';
import type { RecurringRule, RecurringRulePayload } from '../../types/RecurringApi';
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

function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };
  return map[freq] ?? freq;
}

function nextRunLabel(rule: RecurringRule): string {
  const date = new Date(rule.next_run_date);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${frequencyLabel(rule.frequency)} · next on ${formatted}`;
}

type ModalState = { mode: 'create' } | { mode: 'edit'; rule: RecurringRule } | null;

export default function Recurring() {
  const { data: rules, isLoading, isError } = useRecurringRules();
  const createMutation = useCreateRecurringRule();
  const updateMutation = useUpdateRecurringRule();
  const deleteMutation = useDeleteRecurringRule();

  const [modalState, setModalState] = useState<ModalState>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleModalSubmit(payload: RecurringRulePayload) {
    setModalError(null);
    try {
      if (modalState?.mode === 'edit') {
        await updateMutation.mutateAsync({ id: modalState.rule.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setModalState(null);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  }

  async function handleToggle(rule: RecurringRule) {
    setTogglingId(rule.id);
    try {
      await updateMutation.mutateAsync({
        id: rule.id,
        payload: { isActive: !rule.is_active },
      });
    } catch (err) {
      alert(getErrorMessage(err, 'Could not update this rule.'));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this recurring rule? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete this rule.'));
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="text-ink-soft">Loading recurring rules…</div>;
  }

  if (isError) {
    return <div className="text-red">Could not load recurring rules. Please refresh.</div>;
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
        Automation
        <span className="flex-1 h-px bg-rule" />
      </div>
      <div className="flex items-baseline justify-between flex-wrap gap-3.5 mb-8">
        <div>
          <h1 className="text-[34px] font-semibold text-ink">Recurring transactions</h1>
          <p className="text-ink-soft mt-1.5 text-[15px] max-w-[520px]">
            Rules that post to your ledger automatically, on a schedule.
          </p>
        </div>
        <button
          onClick={() => setModalState({ mode: 'create' })}
          className="inline-flex items-center gap-2 px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper
                     text-[14px] font-semibold hover:-translate-y-[2px] hover:shadow-lg transition-transform"
        >
          + New rule
        </button>
      </div>

      {(!rules || rules.length === 0) ? (
        <div className="border-[1.5px] border-dashed border-rule rounded-md py-16 text-center text-ink-soft">
          <p className="text-[14px] mb-3">No recurring rules set yet.</p>
          <button
            onClick={() => setModalState({ mode: 'create' })}
            className="text-green font-semibold text-[13.5px]"
          >
            + Set your first rule
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="group flex items-center gap-4 bg-paper-2 border border-rule-soft rounded-md px-[18px] py-4"
            >
              <div className="w-[42px] h-[42px] rounded-lg bg-paper-3 flex items-center justify-center text-[18px] flex-shrink-0">
                {rule.category_icon ?? '🔁'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14.5px] text-ink truncate">{rule.name}</div>
                <div className="text-[12.5px] text-ink-soft mt-0.5">
                  {nextRunLabel(rule)}
                  {rule.category_name ? ` · ${rule.category_name}` : ''}
                </div>
              </div>

              <span className="font-mono text-[10.5px] px-[9px] py-1 rounded-full bg-green-wash text-green font-semibold whitespace-nowrap">
                {formatINR(rule.amount)}
              </span>

              <button
                onClick={() => handleToggle(rule)}
                disabled={togglingId === rule.id}
                aria-label={rule.is_active ? `Turn off ${rule.name}` : `Turn on ${rule.name}`}
                className="relative w-[38px] h-[21px] rounded-full flex-shrink-0 transition-colors disabled:opacity-60"
                style={{ background: rule.is_active ? 'var(--color-green)' : 'var(--color-rule)' }}
              >
                <span
                  className="absolute top-[2px] w-[17px] h-[17px] rounded-full bg-white transition-all"
                  style={{ left: rule.is_active ? '19px' : '2px' }}
                />
              </button>

              <button
                onClick={() => setModalState({ mode: 'edit', rule })}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-ink text-[12px] px-1"
                aria-label={`Edit ${rule.name}`}
              >
                ✎
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-red text-[12px] px-1"
                aria-label={`Delete ${rule.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {modalState && (
        <RecurringModal
          mode={modalState.mode}
          initial={modalState.mode === 'edit' ? modalState.rule : null}
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