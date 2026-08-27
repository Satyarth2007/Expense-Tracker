import { primaryBtnClass, ghostBtnClass } from '../../../components/ui/styles';
import { CATEGORY_GROUPS } from '../../../types/categories';

interface CategoriesStepProps {
  selected: Record<string, string[]>;
  onToggle: (groupId: string, subcategory: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CategoriesStep({ selected, onToggle, onNext, onBack }: CategoriesStepProps) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-brass mb-2">Personalize</div>
      <h1 className="text-[28px] mb-1">Pick your starting categories</h1>
      <p className="text-sm text-ink-soft mb-6">Select what applies — rename, merge, or add more any time.</p>

      <div className="flex flex-col gap-6 mb-7 max-h-[360px] overflow-y-auto pr-1">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.id}>
            <div className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
              <span>{group.icon}</span>
              {group.name}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {group.subcategories.map((sub) => {
                const picked = selected[group.id]?.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => onToggle(group.id, sub)}
                    className={`rounded-md border px-2.5 py-2.5 text-[12.5px] text-center transition-all duration-150 ${
                      picked ? 'border-green bg-green-wash font-semibold text-green' : 'border-rule bg-paper text-ink hover:-translate-y-0.5'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className={ghostBtnClass}>← Back</button>
        <button type="button" onClick={onNext} className={primaryBtnClass + ' flex-1'}>Next →</button>
      </div>
    </div>
  );
}