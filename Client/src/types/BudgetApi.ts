export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Budget {
  id: string;
  category_id: string;
  category_name: string;
  category_color: string | null;
  category_icon: string | null;
  limit_amount: string;       // numeric comes back as string from pg
  period: BudgetPeriod;
  alert_threshold_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  period_start: string;
  period_end: string;
  spent_amount: string;
  remaining_amount: string;
  percent_used: number;
}

export interface BudgetPayload {
  categoryId: string;
  limitAmount: number;
  period?: BudgetPeriod;
  alertThresholdPct?: number;
}

export type BudgetUpdatePayload = Partial<BudgetPayload> & { isActive?: boolean };