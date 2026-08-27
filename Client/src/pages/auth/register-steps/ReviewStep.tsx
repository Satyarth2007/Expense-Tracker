import { primaryBtnClass, ghostBtnClass } from '../../../components/ui/styles';
import { PERSONA_OPTIONS, type PersonaId } from '../../../types/auth';
import { CATEGORY_GROUPS } from '../../../types/categories';
import type { AccountData } from '../Register';

interface ReviewStepProps {
  account: AccountData;
  persona: PersonaId | null;
  workspaceName: string;
  categories: Record<string, string[]>;
  onNext: () => void;
  onBack: () => void;
}

export default function ReviewStep({ account, persona, workspaceName, categories, onNext, onBack }: ReviewStepProps) {
  const personaOption = PERSONA_OPTIONS.find((p) => p.id === persona);
  const chosen = CATEGORY_GROUPS
    .map((group) => ({ group, subs: categories[group.id] ?? [] }))
    .filter((entry) => entry.subs.length > 0);

  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-brass mb-2">Almost there</div>
      <h1 className="text-[28px] mb-1">Review your details</h1>
      <p className="text-sm text-ink-soft mb-6">Check everything below before we send a verification code.</p>

      <div className="flex flex-col gap-4 mb-7">
        <div className="rounded-md border border-rule-soft bg-paper-2 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-soft mb-2">Account</div>
          <div className="text-sm text-ink">{account.fullName}</div>
          <div className="text-sm text-ink-soft">{account.email}</div>
        </div>

        <div className="rounded-md border border-rule-soft bg-paper-2 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-soft mb-2">Workspace</div>
          <div className="text-sm text-ink">{personaOption?.icon} {personaOption?.title}</div>
          <div className="text-sm text-ink-soft mt-1">{workspaceName}</div>
        </div>

        <div className="rounded-md border border-rule-soft bg-paper-2 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-soft mb-2">Categories</div>
          {chosen.length === 0 && <div className="text-sm text-ink-soft">None selected — you can add these later.</div>}
          {chosen.map(({ group, subs }) => (
            <div key={group.id} className="text-sm text-ink mb-1">
              <span className="text-ink-soft">{group.icon} {group.name}:</span> {subs.join(', ')}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className={ghostBtnClass}>← Back</button>
        <button type="button" onClick={onNext} className={primaryBtnClass + ' flex-1'}>Confirm & send code →</button>
      </div>
    </div>
  );
}