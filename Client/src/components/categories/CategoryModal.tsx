import { useEffect, useState, type FormEvent } from 'react';
import type { Category, CategoryPayload } from '../../types/CategoryApi';

interface CategoryModalProps {
  mode: 'create' | 'edit';
  parentId?: string | null; // set when creating a subcategory
  initial?: Category | null; // set when editing
  onClose: () => void;
  onSubmit: (payload: CategoryPayload) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export default function CategoryModal({
  mode,
  parentId = null,
  initial,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: CategoryModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [color, setColor] = useState(initial?.color ?? '#A9793A');
  const [isTaxDeductible, setIsTaxDeductible] = useState(initial?.is_tax_deductible ?? false);

  useEffect(() => {
    setName(initial?.name ?? '');
    setType(initial?.type ?? 'expense');
    setIcon(initial?.icon ?? '');
    setColor(initial?.color ?? '#A9793A');
    setIsTaxDeductible(initial?.is_tax_deductible ?? false);
  }, [initial]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      name: name.trim(),
      type,
      parentId: mode === 'create' ? parentId : initial?.parent_id ?? null,
      icon: icon.trim() || null,
      color: color || null,
      isTaxDeductible,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-paper border border-rule-soft rounded-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2">
          {mode === 'create' ? (parentId ? 'New subcategory' : 'New category') : 'Edit category'}
        </div>
        <h2 className="text-[22px] font-semibold text-ink mb-5">
          {mode === 'create' ? 'Add a category' : name || 'Edit category'}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                         focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-wash)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                disabled={isSubmitting}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Icon (emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                disabled={isSubmitting}
                placeholder="🏷️"
                maxLength={4}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                           focus:outline-none focus:border-green"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isSubmitting}
              className="w-16 h-10 border border-rule rounded-[3px] bg-paper cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-[7px] text-ink-soft text-[13px] mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={isTaxDeductible}
              onChange={(e) => setIsTaxDeductible(e.target.checked)}
              disabled={isSubmitting}
              className="w-auto"
            />
            Tax deductible
          </label>

          {error && (
            <div className="text-red text-[13px] mb-4" role="alert">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-[11px] rounded-[3px] border border-rule text-ink text-[14px] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper text-[14px] font-semibold
                         hover:-translate-y-[2px] hover:shadow-lg transition-transform
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}