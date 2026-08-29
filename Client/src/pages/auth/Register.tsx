import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import AuthLayout from '../../components/layout/AuthLayout.tsx';
import AccountStep from '../auth/register-steps/AccountStep.tsx';
import PersonaStep from '../auth/register-steps/PersonaStep.tsx';
import CategoriesStep from '../auth/register-steps/CategoriesStep.tsx';
import ReviewStep from '../auth/register-steps/ReviewStep.tsx';
import VerifyStep from '../auth/register-steps/VerifyStep';
import type { PersonaId } from '../../types/auth';
import { useAuth, type ApiErrorResponse } from '../../context/AuthContext';
import { CATEGORY_GROUPS } from '../../types/categories';
import { createCategory } from '../../lib/categories';

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

// Unwraps authController's error shape — either a plain string ("Invalid or
// expired OTP") or a Zod .flatten() object — into one message a form can show.
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

export default function Register() {
  const navigate = useNavigate();
  const { sendOtp, register } = useAuth();

  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<AccountData>(INITIAL_ACCOUNT);
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [categories, setCategories] = useState<Record<string, string[]>>({});

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

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

  // Fires the OTP email when the user leaves Review for Verify. sendOtp's
  // own 409 check (email already registered) surfaces here — before the
  // user types a code for an account that can never be created.
  async function handleReviewNext() {
    setOtpError(null);
    setIsSendingOtp(true);
    try {
      await sendOtp(account.email);
      setStep(5);
    } catch (err) {
      setOtpError(getErrorMessage(err, 'Could not send the verification code. Please try again.'));
    } finally {
      setIsSendingOtp(false);
    }
  }

  // registerSchema only accepts { email, password, fullName, otp } — persona,
  // workspaceName, and categories are NOT sent to the backend. Persona is
  // UI-only per the locked scope (register always creates a 'personal'
  // workspace regardless of what's picked in step 2).
  //
  // Categories collected in step 3 currently have nowhere to go: there's no
  // Categories API yet (next in the build order, after this). Once it
  // exists, loop `categories` here after register() resolves and POST each
  // one using the freshly issued accessToken — for now the selections are
  // just discarded on submit, which is worth knowing before you demo this.
  // Wired to VerifyStep's "Resend code" button. Reuses the same sendOtp
  // call as leaving Review — VerifyStep manages its own "Sending…"/"Sent!"
  // state locally and only needs this to resolve or reject.
  async function handleResend() {
    await sendOtp(account.email);
  }

  async function handleVerify(code: string) {
    setVerifyError(null);
    setIsVerifying(true);
    try {
      await register({
        email: account.email,
        password: account.password,
        fullName: account.fullName,
        otp: code,
      });

      // Persist the categories picked in Step 3 (Category picker gives group
      // names like "Food & Dining" and subcategory names like "Groceries").
      // register() has already set the token in AuthContext by the time we
      // get here, so `api` (via the request interceptor) will send it.
      for (const [groupId, subcats] of Object.entries(categories)) {
        if (subcats.length === 0) continue;

        const group = CATEGORY_GROUPS.find((g) => g.id === groupId);
        if (!group) continue;

        try {
          const parent = await createCategory({
            name: group.name,
            type: 'expense',
            icon: group.icon,
          });

          for (const subName of subcats) {
            await createCategory({
              name: subName,
              type: 'expense',
              parentId: parent.id,
            });
          }
        } catch (categoryErr) {
          // Don't block the user from reaching the dashboard just because
          // one category failed (e.g. a duplicate name edge case) — log and
          // continue with the rest.
          console.error(`Failed to create category group "${group.name}":`, categoryErr);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      setVerifyError(getErrorMessage(err, 'Verification failed. Please check the code and try again.'));
    } finally {
      setIsVerifying(false);
    }
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
          onNext={handleReviewNext}
          onBack={() => setStep(3)}
          isSubmitting={isSendingOtp}
          error={otpError}
        />
      )}
      {step === 5 && (
        <VerifyStep
          email={account.email}
          onVerify={handleVerify}
          onBack={() => setStep(4)}
          onResend={handleResend}
          isSubmitting={isVerifying}
          error={verifyError}
        />
      )}
    </AuthLayout>
  );
}