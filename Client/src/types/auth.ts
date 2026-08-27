export type PersonaId = 'individual' | 'business' | 'student';

export interface PersonaOption {
  id: PersonaId;
  title: string;
  tagline: string;
  description: string;
  icon: string;
}

export const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: 'individual',
    title: 'Individual',
    tagline: 'Personal workspace',
    description: 'Track everyday income and spending across your own accounts.',
    icon: '👤',
  },
  {
    id: 'business',
    title: 'Small Business',
    tagline: 'Business workspace',
    description: 'Separate business transactions, budgets, and reports from personal ones.',
    icon: '💼',
  },
  {
    id: 'student',
    title: 'Student / Young Professional',
    tagline: 'Personal workspace',
    description: 'Keep tabs on limited income, shared expenses, and savings goals.',
    icon: '🎓',
  },
];