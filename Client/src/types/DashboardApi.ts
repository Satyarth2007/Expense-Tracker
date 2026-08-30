export interface DashboardStats {
  income: number;
  incomeDeltaPct: number | null;
  expenses: number;
  expensesDeltaPct: number | null;
  netSaved: number;
  netSavedPctOfIncome: number | null;
  budgetsOnTrack: number;
  budgetsTotal: number;
}

export interface DashboardTrendPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface DashboardTopCategory {
  categoryId: string;
  name: string;
  color: string | null;
  icon: string | null;
  total: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  trend: DashboardTrendPoint[];
  topCategories: DashboardTopCategory[];
}