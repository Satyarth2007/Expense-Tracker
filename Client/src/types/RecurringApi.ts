export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  name: string;
  amount: string;
  currency: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  last_run_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringRulePayload {
  categoryId?: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
}

export type RecurringRuleUpdatePayload = Partial<RecurringRulePayload> & { isActive?: boolean };