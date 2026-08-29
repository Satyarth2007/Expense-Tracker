export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  type: 'income' | 'expense';
  color: string | null;
  icon: string | null;
  is_tax_deductible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  type: 'income' | 'expense';
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  isTaxDeductible?: boolean;
}