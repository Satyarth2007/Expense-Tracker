import PersonaCard from './PersonaCard.tsx';
import { inputClass, primaryBtnClass, ghostBtnClass } from '../../../components/ui/styles.ts';
import { PERSONA_OPTIONS, type PersonaId } from '../../../types/auth.ts';

interface PersonaStepProps {
  persona: PersonaId | null;
  onSelect: (id: PersonaId) => void;
  workspaceName: string;
  onWorkspaceNameChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PersonaStep({
  persona,
  onSelect,
  workspaceName,
  onWorkspaceNameChange,
  onNext,
  onBack,
}: PersonaStepProps) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-brass mb-2">Workspace type</div>
      <h1 className="text-[28px] mb-1">Who's keeping the ledger?</h1>
      <p className="text-sm text-ink-soft mb-6">This decides how your workspace is set up — you're not locked in.</p>

      <div className="flex flex-col gap-3 mb-7">
        {PERSONA_OPTIONS.map((option) => (
          <PersonaCard key={option.id} option={option} selected={persona === option.id} onSelect={() => onSelect(option.id)} />
        ))}
      </div>

      {persona && (
        <div className="mb-7">
          <label className="block font-mono text-[11px] tracking-wide uppercase text-ink-soft mb-1.5">
            Workspace name
          </label>
          <input
            required
            type="text"
            value={workspaceName}
            onChange={(e) => onWorkspaceNameChange(e.target.value)}
            placeholder={persona === 'business' ? 'e.g. Acme Co. Books' : "e.g. Satyarth's Ledger"}
            className={inputClass}
          />
          <p className="text-xs text-ink-faint mt-1.5">You can rename this later from Settings.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className={ghostBtnClass}>← Back</button>
        <button
          type="button"
          disabled={!persona || !workspaceName.trim()}
          onClick={onNext}
          className={primaryBtnClass + ' flex-1'}
        >
          Next →
        </button>
      </div>
    </div>
  );
}