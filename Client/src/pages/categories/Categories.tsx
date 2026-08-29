import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks/useCategories';
import CategoryModal from '../../components/categories/CategoryModal';
import type { Category, CategoryPayload } from '../../types/CategoryApi';
import type { ApiErrorResponse } from '../../context/AuthContext';

function getErrorMessage(err: unknown, fallback: string): string {
    if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        const { error } = err.response.data;
        if (typeof error === 'string') return error;
        const firstFieldError = Object.values(error.fieldErrors).flat()[0];
        if (firstFieldError) return firstFieldError;
        if (error.formErrors[0]) return error.formErrors[0];
    }
    return fallback;
}

type ModalState =
  | { mode: 'create'; parentId: string | null }
  | { mode: 'edit'; category: Category }
  | null;

export default function Categories() {
    const { data: categories, isLoading, isError } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [modalState, setModalState] = useState<ModalState>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const parents = useMemo(() => (categories ?? []).filter((c) => c.parent_id === null), [categories]);
    const childrenOf = (parentId: string) => (categories ?? []).filter((c) => c.parent_id === parentId);
    const selectedParent = parents.find((p) => p.id === selectedParentId) ?? null;

    async function handleModalSubmit(payload: CategoryPayload) {
        setModalError(null);
        try {
            if (modalState?.mode === 'edit') {
                await updateMutation.mutateAsync({ id: modalState.category.id, payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            setModalState(null);
        } catch (err) {
            setModalError(getErrorMessage(err, 'Something went wrong. Please try again.'));
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this category? This cannot be undone.')) return;
        try {
            await deleteMutation.mutateAsync(id);
            if (selectedParentId === id) setSelectedParentId(null);
        } catch (err) {
            alert(getErrorMessage(err, 'Could not delete this category.'));
        }
    }

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isLoading) {
        return <div className="text-ink-soft">Loading categories…</div>;
    }

    if (isError) {
        return <div className="text-red">Could not load categories. Please refresh.</div>;
    }

    return (
        <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
                Structure
                <span className="flex-1 h-px bg-rule" />
            </div>
            <div className="flex items-baseline justify-between flex-wrap gap-3.5 mb-8">
                <div>
                    <h1 className="text-[34px] font-semibold text-ink">Categories</h1>
                    <p className="text-ink-soft mt-1.5 text-[15px] max-w-[520px]">
                        The columns of your ledger — used across transactions, budgets, and reports.
                    </p>
                </div>
                <button
                    onClick={() => setModalState({ mode: 'create', parentId: null })}
                    className="inline-flex items-center gap-2 px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper
                     text-[14px] font-semibold hover:-translate-y-[2px] hover:shadow-lg transition-transform"
                >
                    + Add category
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {parents.map((cat) => {
                    const childCount = childrenOf(cat.id).length;
                    const isSelected = selectedParentId === cat.id;
                    return (
                        <div
                            key={cat.id}
                            onClick={() => setSelectedParentId(isSelected ? null : cat.id)}
                            className={`group cursor-pointer bg-paper-2 border rounded-md p-[18px] transition-transform hover:-translate-y-[3px] hover:shadow-lg ${isSelected ? 'border-green' : 'border-rule-soft'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[17px] mb-3"
                                    style={{ background: cat.color ? `${cat.color}22` : 'var(--color-paper-3)', color: cat.color ?? 'var(--color-ink-soft)' }}
                                >
                                    {cat.icon ?? '🏷️'}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setModalState({ mode: 'edit', category: cat });
                                        }}
                                        className="text-ink-faint hover:text-ink text-[12px] px-1.5 py-0.5"
                                        aria-label={`Edit ${cat.name}`}
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(cat.id);
                                        }}
                                        className="text-ink-faint hover:text-red text-[12px] px-1.5 py-0.5"
                                        aria-label={`Delete ${cat.name}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="font-semibold text-[14.5px] text-ink">{cat.name}</div>
                            <div className="font-mono text-[12px] text-ink-soft mt-1">
                                {childCount} subcategor{childCount === 1 ? 'y' : 'ies'}
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={() => setModalState({ mode: 'create', parentId: null })}
                    className="flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-rule rounded-md
                     text-ink-soft text-[13px] min-h-[120px] hover:border-green hover:text-green transition-colors"
                >
                    + Add category
                </button>
            </div>

            {selectedParent && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[18px] font-semibold text-ink">
                            {selectedParent.icon} {selectedParent.name} — subcategories
                        </h3>
                        <button
                            onClick={() => setModalState({ mode: 'create', parentId: selectedParent.id })}
                            className="text-[13px] font-semibold text-green"
                        >
                            + Add subcategory
                        </button>
                    </div>

                    {childrenOf(selectedParent.id).length === 0 ? (
                        <p className="text-ink-soft text-[14px]">No subcategories yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {childrenOf(selectedParent.id).map((child) => (
                                <div
                                    key={child.id}
                                    className="group bg-paper-2 border border-rule-soft rounded-md p-3.5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2 text-[13.5px] text-ink">
                                        <span>{child.icon ?? '🏷️'}</span>
                                        {child.name}
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                            onClick={() => setModalState({ mode: 'edit', category: child })}
                                            className="text-ink-faint hover:text-ink text-[12px] px-1"
                                            aria-label={`Edit ${child.name}`}
                                        >
                                            ✎
                                        </button>
                                        <button
                                            onClick={() => handleDelete(child.id)}
                                            className="text-ink-faint hover:text-red text-[12px] px-1"
                                            aria-label={`Delete ${child.name}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {modalState && (
                <CategoryModal
                    mode={modalState.mode}
                    parentId={modalState.mode === 'create' ? modalState.parentId : undefined}
                    initial={modalState.mode === 'edit' ? modalState.category : null}
                    onClose={() => {
                        setModalState(null);
                        setModalError(null);
                    }}
                    onSubmit={handleModalSubmit}
                    isSubmitting={isSubmitting}
                    error={modalError}
                />
            )}
        </div>
    );
}