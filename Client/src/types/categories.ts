export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍳', subcategories: ['Groceries', 'Dining out', 'Coffee', 'Delivery', 'Bar & drinks', 'Snacks'] },
  { id: 'transport', name: 'Transport', icon: '🚕', subcategories: ['Fuel', 'Public transit', 'Cabs & rideshare'] },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', subcategories: ['Clothing', 'Electronics', 'Home goods', 'Personal care'] },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📺', subcategories: ['Streaming', 'Software', 'News & media'] },
  { id: 'health', name: 'Health', icon: '🩺', subcategories: ['Pharmacy', 'Doctor visits'] },
];