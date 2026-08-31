import { useAuth } from '../../context/AuthContext';
import { useDashboardSummary } from '../../hooks/useDashboard';
import { useBudgets } from '../../hooks/useBudgets';
import { useCategories } from '../../hooks/useCategories';

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// Accepts number, numeric string (pg returns numeric as string), null, or undefined.
function formatINR(value: number | string | undefined | null): string {
  if (value == null) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function Account() {
  const { user } = useAuth();

  const { data: dashboard, isLoading: dashboardLoading } = useDashboardSummary();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  if (!user) return null;

  // Real shape (types/DashboardApi.ts): DashboardSummary -> stats: DashboardStats
  const income = dashboard?.stats?.income;
  const expenses = dashboard?.stats?.expenses;
  const netSaved = dashboard?.stats?.netSaved;
  const budgetsOnTrack = dashboard?.stats?.budgetsOnTrack;
  const budgetsOnTrackTotal = dashboard?.stats?.budgetsTotal;

  const activeBudgetsCount = budgets?.length ?? 0;
  const categoriesCount = categories?.length ?? 0;

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
        Your profile
        <span className="flex-1 h-px bg-rule" />
      </div>
      <h1 className="text-[34px] font-semibold text-ink">Account</h1>
      <p className="text-ink-soft mt-1.5 text-[15px] mb-8">
        A summary of your ledger and account details.
      </p>

      {/* Profile card */}
      <div className="bg-paper-2 border border-rule-soft rounded-md p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full border-2 border-brass-light text-brass-light
                        flex items-center justify-center font-serif font-bold text-[24px] flex-shrink-0">
          {initialsOf(user.fullName)}
        </div>
        <div>
          <div className="font-semibold text-[19px] text-ink">{user.fullName}</div>
          <div className="text-[14px] text-ink-soft mt-1">{user.email}</div>
          <div className="font-mono text-[11px] text-ink-faint mt-2 uppercase tracking-wider">
            Workspace · {user.workspaceId}
          </div>
        </div>
      </div>

      {/* Stat row — mirrors dashboard's .stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-paper-2 border border-rule-soft rounded-md p-5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
            This month's income
          </div>
          <div className="font-mono text-[22px] font-semibold mt-2 text-green">
            {dashboardLoading ? '—' : formatINR(income)}
          </div>
        </div>
        <div className="bg-paper-2 border border-rule-soft rounded-md p-5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
            This month's expenses
          </div>
          <div className="font-mono text-[22px] font-semibold mt-2 text-red">
            {dashboardLoading ? '—' : formatINR(expenses)}
          </div>
        </div>
        <div className="bg-paper-2 border border-rule-soft rounded-md p-5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
            Active budgets
          </div>
          <div className="font-mono text-[22px] font-semibold mt-2 text-ink">
            {budgetsLoading ? '—' : activeBudgetsCount}
          </div>
          {budgetsOnTrack != null && budgetsOnTrackTotal != null && (
            <div className="text-[12px] text-ink-soft mt-1">
              {budgetsOnTrack}/{budgetsOnTrackTotal} on track
            </div>
          )}
        </div>
        <div className="bg-paper-2 border border-rule-soft rounded-md p-5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
            Categories
          </div>
          <div className="font-mono text-[22px] font-semibold mt-2 text-ink">
            {categoriesLoading ? '—' : categoriesCount}
          </div>
        </div>
      </div>

      {/* Net saved — headline number, called out separately */}
      {!dashboardLoading && netSaved != null && (
        <div className="bg-paper-2 border border-rule-soft rounded-md p-6 mb-6 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
              Net saved this month
            </div>
            <div className="text-[13px] text-ink-soft mt-1">
              Income minus expenses, across your whole ledger
            </div>
          </div>
          <div className="font-mono text-[26px] font-semibold text-ink">
            {formatINR(netSaved)}
          </div>
        </div>
      )}

      {/* Budget breakdown list */}
      {!budgetsLoading && budgets && budgets.length > 0 && (
        <div className="bg-paper-2 border border-rule-soft rounded-md p-6">
          <h3 className="text-[15px] font-semibold text-ink mb-4">Your budgets</h3>
          {budgets.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between py-2.5 border-b border-dashed border-rule last:border-none"
            >
              <span className="text-[14px] text-ink">{b.category_name}</span>
              <span className="font-mono text-[13px] text-ink-soft">
                {formatINR(b.spent_amount)} / {formatINR(b.limit_amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}