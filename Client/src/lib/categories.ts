import api from './axios';
import type { Category, CategoryPayload } from '../types/CategoryApi';

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories');
  return data.categories;
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  const { data } = await api.post('/categories', payload);
  return data.category;
}

export async function updateCategory(id: string, payload: Partial<CategoryPayload>): Promise<Category> {
  const { data } = await api.patch(`/categories/${id}`, payload);
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}