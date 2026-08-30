import { useDashboardSummary } from '../../hooks/useDashboard';
import { useAuth } from '../../context/AuthContext';

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDelta(pct: number | null): { text: string; positive: boolean } | null {
  if (pct === null) return null;
  const positive = pct >= 0;
  return { text: `${positive ? '↑' : '↓'} ${Math.abs(pct)}% vs last month`, positive };
}

function firstNameOf(fullName: string | undefined): string {
  if (!fullName) return 'there';
  return fullName.trim().split(/\s+/)[0];
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboardSummary();
  const { user } = useAuth();

  if (isLoading) {
    return <div className="text-ink-soft">Loading dashboard…</div>;
  }

  if (isError || !data) {
    return <div className="text-red">Could not load dashboard. Please refresh.</div>;
  }

  const { stats, trend, topCategories } = data;
  const incomeDelta = formatDelta(stats.incomeDeltaPct);
  const expensesDelta = formatDelta(stats.expensesDeltaPct);
  const firstName = firstNameOf(user?.fullName);

  const maxTrendValue = Math.max(
    ...trend.flatMap((t) => [t.income, t.expenses]),
    1
  );

  const now = new Date();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
        Overview · {monthLabel}
        <span className="flex-1 h-px bg-rule" />
      </div>
      <div className="flex items-baseline justify-between flex-wrap gap-3.5 mb-8">
        <div>
          <h1 className="text-[34px] font-semibold text-ink">Good {greeting()}, {firstName}</h1>
          <p className="text-ink-soft mt-1.5 text-[15px] max-w-[520px]">
            Here's where things stand across your ledger this month.
          </p>
        </div>
      </div>

      {/* ---- Stat row ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-paper-2 border border-rule-soft rounded-md p-5 relative overflow-hidden">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">Income</div>
          <div className="font-mono text-[27px] font-semibold mt-2 text-green">
            {formatINR(stats.income)}
          </div>
          <div
            className="text-[12px] mt-1.5"
            style={{ color: incomeDelta ? (incomeDelta.positive ? 'var(--color-green)' : 'var(--color-red)') : 'var(--color-ink-soft)' }}
          >
            {incomeDelta ? incomeDelta.text : '—'}
          </div>
        </div>

        <div className="bg-paper-2 border border-rule-soft rounded-md p-5 relative overflow-hidden">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">Expenses</div>
          <div className="font-mono text-[27px] font-semibold mt-2 text-red">
            {formatINR(stats.expenses)}
          </div>
          <div
            className="text-[12px] mt-1.5"
            style={{ color: expensesDelta ? (expensesDelta.positive ? 'var(--color-red)' : 'var(--color-green)') : 'var(--color-ink-soft)' }}
          >
            {expensesDelta ? expensesDelta.text : '—'}
          </div>
        </div>

        <div className="bg-paper-2 border border-rule-soft rounded-md p-5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">Net saved</div>
          <div className="font-mono text-[27px] font-semibold mt-2 text-ink">
            {formatINR(stats.netSaved)}
          </div>
          <div className="text-[12px] mt-1.5 text-ink-soft">
            {stats.netSavedPctOfIncome !== null ? `${stats.netSavedPctOfIncome}% of income` : '—'}
          </div>
        </div>

        <div className="bg-paper-2 border border-rule-soft rounded-md p-5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">Budgets on track</div>
          <div className="font-mono text-[27px] font-semibold mt-2 text-ink">
            {stats.budgetsOnTrack} / {stats.budgetsTotal}
          </div>
          <div className="text-[12px] mt-1.5 text-ink-soft">
            {stats.budgetsTotal - stats.budgetsOnTrack} running over
          </div>
        </div>
      </div>

      {/* ---- Trend + Top categories ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        <div className="bg-paper-2 border border-rule-soft rounded-md p-[22px] shadow-lg">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[16px] font-semibold text-ink">Income vs. expenses</h3>
            <span className="font-mono text-[11px] text-ink-soft">LAST 6 MONTHS</span>
          </div>

          <div className="flex items-end gap-3.5 h-[180px] px-1">
            {trend.map((point) => {
              const incomeHeight = (point.income / maxTrendValue) * 100;
              const expenseHeight = (point.expenses / maxTrendValue) * 100;
              return (
                <div key={point.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex flex-col-reverse gap-[2px] h-full justify-end">
                    <div
                      className="w-full rounded-t-[3px]"
                      style={{ height: `${incomeHeight}%`, background: 'var(--color-green-2)' }}
                      title={`Income: ${formatINR(point.income)}`}
                    />
                    <div
                      className="w-full rounded-t-[3px] opacity-80"
                      style={{ height: `${expenseHeight}%`, background: 'var(--color-red)' }}
                      title={`Expenses: ${formatINR(point.expenses)}`}
                    />
                  </div>
                  <span className="font-mono text-[10.5px] text-ink-soft">{point.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 text-[12px] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <i className="inline-block w-[9px] h-[9px] rounded-sm" style={{ background: 'var(--color-green-2)' }} />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block w-[9px] h-[9px] rounded-sm opacity-80" style={{ background: 'var(--color-red)' }} />
              Expenses
            </span>
          </div>
        </div>

        <div className="bg-paper-2 border border-rule-soft rounded-md p-[22px] shadow-lg">
          <h3 className="text-[16px] font-semibold text-ink mb-1.5">Top categories</h3>
          {topCategories.length === 0 ? (
            <p className="text-ink-soft text-[14px] mt-4">No expenses recorded this month yet.</p>
          ) : (
            topCategories.map((cat) => (
              <div
                key={cat.categoryId}
                className="flex items-center gap-3 py-2.5 border-b border-dashed border-rule last:border-none"
              >
                <span
                  className="w-[9px] h-[9px] rounded-full flex-shrink-0"
                  style={{ background: cat.color ?? 'var(--color-ink-faint)' }}
                />
                <span className="flex-1 text-[14px] text-ink">
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </span>
                <span className="font-mono text-[13.5px] text-ink">{formatINR(cat.total)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}