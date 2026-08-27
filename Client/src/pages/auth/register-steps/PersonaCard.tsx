import type { PersonaOption } from '../../../types/auth';

interface PersonaCardProps {
  option: PersonaOption;
  selected: boolean;
  onSelect: () => void;
}

export default function PersonaCard({ option, selected, onSelect }: PersonaCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left w-full rounded-md border p-5 flex items-start gap-4 transition-all duration-150
        ${selected
          ? 'border-green bg-green-wash shadow-[0_10px_30px_rgba(34,31,26,0.12)]'
          : 'border-rule bg-paper hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(34,31,26,0.12)]'}`}
    >
      <span className="text-2xl leading-none">{option.icon}</span>
      <span className="flex-1">
        <span className={`block font-semibold text-[15px] ${selected ? 'text-green' : 'text-ink'}`}>{option.title}</span>
        <span className="block font-mono text-[11px] uppercase tracking-wide text-ink-faint mt-1">{option.tagline}</span>
        <span className="block text-sm text-ink-soft mt-2">{option.description}</span>
      </span>
      <span className={`w-4 h-4 rounded-full border flex-shrink-0 mt-1 ${selected ? 'border-green bg-green' : 'border-rule'}`} />
    </button>
  );
}