import { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  useUploadImportFile,
  useConfirmMapping,
  useUpdateStagedRow,
  useCommitImport,
  useDiscardImport,
} from '../../hooks/useImport';
import { useCategories } from '../../hooks/useCategories';
import type {
  UploadResponse,
  ColumnMapping,
  StagedImportRow,
} from '../../types/ImportApi';
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

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

type Stage =
  | { step: 'upload' }
  | { step: 'mapping'; upload: UploadResponse }
  | { step: 'review'; sessionId: string; rows: StagedImportRow[]; skippedCount: number };

export default function Import() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ step: 'upload' });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: categories } = useCategories();
  const uploadMutation = useUploadImportFile();
  const confirmMappingMutation = useConfirmMapping();
//   const commitMutation = useCommitImport();
  const discardMutation = useDiscardImport();

  const expenseCategories = (categories ?? []).filter((c) => c.type === 'expense');

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are supported right now.');
      return;
    }
    try {
      const result = await uploadMutation.mutateAsync(file);
      setStage({ step: 'mapping', upload: result });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not parse this file.'));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDiscard() {
    if (stage.step === 'review') {
      discardMutation.mutate(stage.sessionId);
    }
    setStage({ step: 'upload' });
    setError(null);
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2 flex items-center gap-2.5">
        Bring in data
        <span className="flex-1 h-px bg-rule" />
      </div>
      <div className="flex items-baseline justify-between flex-wrap gap-3.5 mb-8">
        <div>
          <h1 className="text-[34px] font-semibold text-ink">Import bank statement</h1>
          <p className="text-ink-soft mt-1.5 text-[15px] max-w-[520px]">
            Upload a CSV — every row lands in a review queue before anything is committed.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-red text-[13px] mb-4 bg-red-wash border border-[#E0C4C0] rounded-md px-4 py-3" role="alert">
          {error}
        </div>
      )}

      {stage.step === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg py-[52px] px-5 text-center bg-paper-2 cursor-pointer transition-colors ${
            isDragging ? 'border-brass bg-paper-3' : 'border-rule hover:border-brass hover:bg-paper-3'
          }`}
        >
          <div className="text-[34px] mb-3.5">📄</div>
          <h3 className="text-[16px] font-semibold text-ink mb-1.5">
            {uploadMutation.isPending ? 'Parsing…' : 'Drop your statement here'}
          </h3>
          <p className="text-ink-soft text-[13.5px] mb-4">
            Supports CSV · bank statements are parsed, never auto-categorized
          </p>
          <button
            type="button"
            disabled={uploadMutation.isPending}
            className="px-[14px] py-[7px] rounded-[3px] border border-ink bg-ink text-paper text-[12.5px] font-semibold
                       disabled:opacity-60"
          >
            {uploadMutation.isPending ? 'Uploading…' : 'Choose file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {stage.step === 'mapping' && (
        <MappingStep
          upload={stage.upload}
          isSubmitting={confirmMappingMutation.isPending}
          onCancel={handleDiscard}
          onConfirm={async (mapping) => {
            setError(null);
            try {
              const result = await confirmMappingMutation.mutateAsync({
                sessionId: stage.upload.sessionId,
                mapping,
              });
              setStage({
                step: 'review',
                sessionId: result.sessionId,
                rows: result.stagedRows,
                skippedCount: result.skippedCount,
              });
            } catch (err) {
              setError(getErrorMessage(err, 'Could not map these columns.'));
            }
          }}
        />
      )}

      {stage.step === 'review' && (
        <ReviewStep
          sessionId={stage.sessionId}
          initialRows={stage.rows}
          skippedCount={stage.skippedCount}
          categories={expenseCategories}
          onDiscard={handleDiscard}
          onCommitted={() => setStage({ step: 'upload' })}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mapping step — confirm which CSV column is which
// ---------------------------------------------------------------------------

function MappingStep({
  upload,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  upload: UploadResponse;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: (mapping: ColumnMapping) => void;
}) {
  const [dateColumn, setDateColumn] = useState(upload.guessedMapping.dateColumn ?? '');
  const [descriptionColumn, setDescriptionColumn] = useState(upload.guessedMapping.descriptionColumn ?? '');

  type Mode = 'signed' | 'separate' | 'typeColumn';
  const [mode, setMode] = useState<Mode>('signed');

  const [amountColumn, setAmountColumn] = useState(upload.guessedMapping.amountColumn ?? '');
  const [debitColumn, setDebitColumn] = useState(upload.guessedMapping.debitColumn ?? '');
  const [creditColumn, setCreditColumn] = useState(upload.guessedMapping.creditColumn ?? '');
  const [typeColumn, setTypeColumn] = useState('');
  const [debitValue, setDebitValue] = useState('Db');
  const [creditValue, setCreditValue] = useState('Cr');

  const isValid =
    dateColumn !== '' &&
    descriptionColumn !== '' &&
    (mode === 'separate'
      ? debitColumn !== '' && creditColumn !== ''
      : mode === 'typeColumn'
      ? amountColumn !== '' && typeColumn !== '' && debitValue !== '' && creditValue !== ''
      : amountColumn !== '');

  function handleSubmit() {
    if (!isValid) return;
    if (mode === 'separate') {
      onConfirm({ dateColumn, descriptionColumn, debitColumn, creditColumn });
    } else if (mode === 'typeColumn') {
      onConfirm({ dateColumn, descriptionColumn, amountColumn, typeColumn, debitValue, creditValue });
    } else {
      onConfirm({ dateColumn, descriptionColumn, amountColumn });
    }
  }

  return (
    <div className="bg-paper-2 border border-rule-soft rounded-md p-6 shadow-lg">
      <h3 className="text-[16px] font-semibold text-ink mb-1">Confirm your columns</h3>
      <p className="text-ink-soft text-[13px] mb-5">
        {upload.totalRows} rows found. We guessed a mapping below — check it's right before continuing.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
            Date column
          </label>
          <select
            value={dateColumn}
            onChange={(e) => setDateColumn(e.target.value)}
            className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink"
          >
            <option value="" disabled>Select…</option>
            {upload.headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
            Description column
          </label>
          <select
            value={descriptionColumn}
            onChange={(e) => setDescriptionColumn(e.target.value)}
            className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink"
          >
            <option value="" disabled>Select…</option>
            {upload.headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
          How is the amount represented?
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink"
        >
          <option value="signed">Single amount column (negative = expense)</option>
          <option value="separate">Separate debit and credit amount columns</option>
          <option value="typeColumn">Single amount column + a debit/credit type column</option>
        </select>
      </div>

      {mode === 'separate' && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Debit / withdrawal column
            </label>
            <select value={debitColumn} onChange={(e) => setDebitColumn(e.target.value)}
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink">
              <option value="" disabled>Select…</option>
              {upload.headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
              Credit / deposit column
            </label>
            <select value={creditColumn} onChange={(e) => setCreditColumn(e.target.value)}
              className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink">
              <option value="" disabled>Select…</option>
              {upload.headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>
      )}

      {mode === 'signed' && (
        <div className="mb-5">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
            Amount column
          </label>
          <select value={amountColumn} onChange={(e) => setAmountColumn(e.target.value)}
            className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink">
            <option value="" disabled>Select…</option>
            {upload.headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      )}

      {mode === 'typeColumn' && (
        <div className="mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Amount column
              </label>
              <select value={amountColumn} onChange={(e) => setAmountColumn(e.target.value)}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink">
                <option value="" disabled>Select…</option>
                {upload.headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Type column
              </label>
              <select value={typeColumn} onChange={(e) => setTypeColumn(e.target.value)}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink">
                <option value="" disabled>Select…</option>
                {upload.headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Value meaning "debit" (e.g. Db)
              </label>
              <input
                type="text"
                value={debitValue}
                onChange={(e) => setDebitValue(e.target.value)}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
                Value meaning "credit" (e.g. Cr)
              </label>
              <input
                type="text"
                value={creditValue}
                onChange={(e) => setCreditValue(e.target.value)}
                className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink"
              />
            </div>
          </div>
        </div>
      )}

      {upload.previewRows.length > 0 && (
        <div className="mb-5 overflow-x-auto">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft mb-2">Preview</div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr>
                {upload.headers.map((h) => (
                  <th key={h} className="text-left font-mono text-[10.5px] text-ink-soft border-b border-ink pb-2 pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upload.previewRows.slice(0, 3).map((row, i) => (
                <tr key={i} className="border-b border-rule-soft">
                  {upload.headers.map((h) => (
                    <td key={h} className="py-2 pr-3 text-ink whitespace-nowrap">{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} disabled={isSubmitting}
          className="px-5 py-[11px] rounded-[3px] border border-rule text-ink text-[14px] font-semibold">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting || !isValid}
          className="px-5 py-[11px] rounded-[3px] border border-ink bg-ink text-paper text-[14px] font-semibold
                     hover:-translate-y-[2px] hover:shadow-lg transition-transform
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
          {isSubmitting ? 'Parsing…' : 'Continue to review'}
        </button>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Review step — edit staged rows, exclude any, then commit
// ---------------------------------------------------------------------------

function ReviewStep({
  sessionId,
  initialRows,
  skippedCount,
  categories,
  onDiscard,
  onCommitted,
}: {
  sessionId: string;
  initialRows: StagedImportRow[];
  skippedCount: number;
  categories: { id: string; name: string; icon: string | null }[];
  onDiscard: () => void;
  onCommitted: () => void;
}) {
  const [rows, setRows] = useState(initialRows);
  const [error, setError] = useState<string | null>(null);
  const updateRowMutation = useUpdateStagedRow(sessionId);
  const commitMutation = useCommitImport();

  const includedCount = rows.filter((r) => !r.excluded).length;
  const duplicateCount = rows.filter((r) => r.possibleDuplicate && !r.excluded).length;

  function patchLocalRow(rowId: string, patch: Partial<StagedImportRow>) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }

  async function handleRowChange(rowId: string, patch: Partial<StagedImportRow>) {
    patchLocalRow(rowId, patch); // optimistic
    try {
      await updateRowMutation.mutateAsync({ rowId, payload: patch });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save that change.'));
    }
  }

  async function handleCommit() {
    setError(null);
    try {
      const result = await commitMutation.mutateAsync(sessionId);
      alert(`${result.importedCount} transaction(s) imported.`);
      onCommitted();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not commit this import.'));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="text-[13.5px] text-ink-soft">
          {includedCount} of {rows.length} rows selected
          {skippedCount > 0 && ` · ${skippedCount} row(s) skipped (unreadable date or amount)`}
          {duplicateCount > 0 && ` · ${duplicateCount} possible duplicate(s)`}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-[3px] border border-rule text-ink text-[13px] font-semibold"
          >
            Discard
          </button>
          <button
            onClick={handleCommit}
            disabled={commitMutation.isPending || includedCount === 0}
            className="px-4 py-2 rounded-[3px] border border-ink bg-ink text-paper text-[13px] font-semibold
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {commitMutation.isPending ? 'Importing…' : `Import ${includedCount} transaction(s)`}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red text-[13px] mb-4 bg-red-wash border border-[#E0C4C0] rounded-md px-4 py-3" role="alert">
          {error}
        </div>
      )}

      <div className="bg-paper-2 border border-rule-soft rounded-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-10"></th>
              <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-[10px] pt-4 border-b-[1.5px] border-ink">Date</th>
              <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-[10px] pt-4 border-b-[1.5px] border-ink">Description</th>
              <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-[10px] pt-4 border-b-[1.5px] border-ink">Category</th>
              <th className="text-left font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-[10px] pt-4 border-b-[1.5px] border-ink">Type</th>
              <th className="text-right font-mono text-[10.5px] uppercase tracking-wider text-ink-soft px-3 pb-[10px] pt-4 border-b-[1.5px] border-ink">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-rule-soft ${row.excluded ? 'opacity-40' : ''}`}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={!row.excluded}
                    onChange={(e) => handleRowChange(row.id, { excluded: !e.target.checked })}
                    className="w-auto"
                  />
                </td>
                <td className="px-3 py-3 text-[13.5px] text-ink font-mono whitespace-nowrap">
                  {row.date}
                </td>
                <td className="px-3 py-3 text-[13.5px] text-ink">
                  {row.description}
                  {row.possibleDuplicate && (
                    <span className="ml-2 font-mono text-[10px] px-[7px] py-[2px] rounded-full bg-red-wash text-red font-semibold">
                      possible duplicate
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <select
                    value={row.categoryId ?? ''}
                    onChange={(e) => handleRowChange(row.id, { categoryId: e.target.value || null })}
                    disabled={row.excluded}
                    className="text-[13px] px-2 py-1.5 border border-rule rounded-[3px] bg-paper text-ink"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <select
                    value={row.type}
                    onChange={(e) => handleRowChange(row.id, { type: e.target.value as 'income' | 'expense' })}
                    disabled={row.excluded}
                    className="text-[13px] px-2 py-1.5 border border-rule rounded-[3px] bg-paper text-ink"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </td>
                <td
                  className={`px-3 py-3 text-right font-mono text-[13.5px] font-semibold ${
                    row.type === 'income' ? 'text-green' : 'text-red'
                  }`}
                >
                  {row.type === 'income' ? '+' : '−'}{formatINR(row.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}