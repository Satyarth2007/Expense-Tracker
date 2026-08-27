import { useState } from 'react';
import AuthLayout from '../../components/layout/AuthLayout.tsx';
import AccountStep from '../auth/register-steps/AccountStep.tsx';
import PersonaStep from '../auth/register-steps/PersonaStep.tsx';
import CategoriesStep from '../auth/register-steps/CategoriesStep.tsx';
import ReviewStep from '../auth/register-steps/ReviewStep.tsx';
import VerifyStep from '../auth/register-steps/VerifyStep';
import type { PersonaId } from '../../types/auth';

export interface AccountData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_ACCOUNT: AccountData = { fullName: '', email: '', password: '', confirmPassword: '' };

const STEP_COPY: Record<number, { heading: string; supporting?: string }> = {
  1: { heading: 'Every rupee, entered in its proper column.', supporting: "The ledger doesn't judge — it just remembers, more reliably than you do." },
  2: { heading: 'A workspace built around how you actually spend.' },
  3: { heading: 'Start with categories that already fit your life.' },
  4: { heading: 'One more look before it goes in the book.' },
  5: { heading: "Almost yours — just confirming it's really you." },
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<AccountData>(INITIAL_ACCOUNT);
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [categories, setCategories] = useState<Record<string, string[]>>({});

  function handlePersonaSelect(id: PersonaId) {
    setPersona(id);
    if (!workspaceName.trim()) {
      setWorkspaceName(id === 'business' ? '' : `${account.fullName || 'My'}'s Ledger`);
    }
  }

  function toggleCategory(groupId: string, sub: string) {
    setCategories((prev) => {
      const current = prev[groupId] ?? [];
      const next = current.includes(sub) ? current.filter((s) => s !== sub) : [...current, sub];
      return { ...prev, [groupId]: next };
    });
  }

  function handleVerify(code: string) {
    // Nothing is written to Postgres until this succeeds — see the
    // Step 4/5 discussion: user + workspace + categories are created
    // together, atomically, only after OTP confirmation.
    // API wiring deferred until src/lib/api.ts + AuthContext land.
    console.log('verify', { account, persona, workspaceName, categories, code });
  }

  const copy = STEP_COPY[step];

  return (
    <AuthLayout step={step} totalSteps={5} heading={copy.heading} supportingText={copy.supporting}>
      {step === 1 && <AccountStep data={account} onChange={setAccount} onNext={() => setStep(2)} />}
      {step === 2 && (
        <PersonaStep
          persona={persona}
          onSelect={handlePersonaSelect}
          workspaceName={workspaceName}
          onWorkspaceNameChange={setWorkspaceName}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && <CategoriesStep selected={categories} onToggle={toggleCategory} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && (
        <ReviewStep
          account={account}
          persona={persona}
          workspaceName={workspaceName}
          categories={categories}
          onNext={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}
      {step === 5 && <VerifyStep email={account.email} onVerify={handleVerify} onBack={() => setStep(4)} />}
    </AuthLayout>
  );
}