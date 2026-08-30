import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useExportReport } from '../../hooks/useReports';
import { getThisMonthRange, getLastMonthRange, getLast3MonthsRange } from '../../utils/dateRanges';
import type { ExportType } from '../../types/ReportApi';
import type { ApiErrorResponse } from '../../context/AuthContext';

function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(err) && err.response) {
    const { error } = err.response.data as unknown as ApiErrorResponse;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const firstFieldError = Object.values(error.fieldErrors ?? {}).flat()[0];
      if (firstFieldError) return firstFieldError as string;
      if (error.formErrors?.[0]) return error.formErrors[0];
    }
  }
  return fallback;
}

type RangeKey = 'this-month' | 'last-month' | 'last-3-months' | 'custom';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'last-3-months', label: 'Last 3 months' },
  { key: 'custom', label: 'Custom range' },
];

function resolveRange(key: RangeKey, customFrom: string, customTo: string) {
  if (key === 'this-month') return getThisMonthRange();
  if (key === 'last-month') return getLastMonthRange();
  if (key === 'last-3-months') return getLast3MonthsRange();
  return { from: customFrom, to: customTo };
}

export default function Reports() {
  const [rangeKey, setRangeKey] = useState<RangeKey>('this-month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<ExportType | null>(null);

  const exportMutation = useExportReport();

  const isCustomIncomplete = rangeKey === 'custom' && (!customFrom || !customTo);

  async function handleExport(type: ExportType) {
    setError(null);
    const { from, to } = resolveRange(rangeKey, customFrom, customTo);

    if (!from || !to) {
      setError('Please choose a date range.');
      return;
    }

    setPendingType(type);
    try {
      await exportMutation.mutateAsync({ type, from, to });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not generate this report.'));
    } finally {
      setPendingType(null);
    }
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
        Take it with you
        <span className="flex-1 h-px bg-rule" />
      </div>
      <div className="flex items-baseline justify-between flex-wrap gap-3.5 mb-8">
        <div>
          <h1 className="text-[34px] font-semibold text-ink">Reports & export</h1>
          <p className="text-ink-soft mt-1.5 text-[15px] max-w-[520px]">
            Generate a statement of your ledger for any period, in the format you need.
          </p>
        </div>
      </div>

      <div className="flex gap-2.5 mb-5 flex-wrap items-center">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setRangeKey(opt.key)}
            className={`px-[13px] py-[7px] rounded-full text-[12.5px] border transition-colors ${
              rangeKey === opt.key
                ? 'bg-green text-white border-green'
                : 'bg-paper-2 text-ink-soft border-rule'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {rangeKey === 'custom' && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-[7px] border border-rule rounded-[3px] bg-paper text-[13px] text-ink"
            />
            <span className="text-ink-soft text-[13px]">to</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-[7px] border border-rule rounded-[3px] bg-paper text-[13px] text-ink"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="text-red text-[13px] mb-5 bg-red-wash border border-[#E0C4C0] rounded-md px-4 py-3" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ExportCard
          badge="CSV"
          title="Raw ledger export"
          description="Every transaction, one row each — for spreadsheets and audits."
          buttonLabel="Export CSV"
          isLoading={pendingType === 'csv'}
          disabled={isCustomIncomplete}
          onClick={() => handleExport('csv')}
        />
        <ExportCard
          badge="PDF"
          title="Formatted statement"
          description="A clean, printable summary with totals by category."
          buttonLabel="Export PDF"
          isLoading={pendingType === 'pdf'}
          disabled={isCustomIncomplete}
          onClick={() => handleExport('pdf')}
        />
        <ExportCard
          badge="SUM"
          title="Category summary"
          description="Just the totals — ideal for tax season or budgeting reviews."
          buttonLabel="Export summary"
          isLoading={pendingType === 'summary-csv'}
          disabled={isCustomIncomplete}
          onClick={() => handleExport('summary-csv')}
        />
      </div>
    </div>
  );
}

function ExportCard({
  badge,
  title,
  description,
  buttonLabel,
  isLoading,
  disabled,
  onClick,
}: {
  badge: string;
  title: string;
  description: string;
  buttonLabel: string;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="bg-paper-2 border border-rule-soft rounded-md p-[26px_18px] text-center">
      <div className="w-[46px] h-[46px] rounded-lg bg-ink text-paper flex items-center justify-center mx-auto mb-3.5 font-mono font-semibold text-[12px]">
        {badge}
      </div>
      <h3 className="text-[16px] font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-[12.5px] text-ink-soft mb-4">{description}</p>
      <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className="px-5 py-[11px] rounded-[3px] border border-rule text-ink text-[14px] font-semibold
                   hover:-translate-y-[2px] hover:shadow-lg transition-transform
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isLoading ? 'Generating…' : buttonLabel}
      </button>
    </div>
  );
}