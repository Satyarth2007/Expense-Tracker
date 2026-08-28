import { useState, type FormEvent } from 'react';
import OtpInput from '../../../components/ui/OtpInput.tsx';
import { primaryBtnClass } from '../../../components/ui/styles.ts';

interface VerifyStepProps {
  email: string;
  onVerify: (code: string) => void;
  onBack: () => void;
  onResend: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export default function VerifyStep({ email, onVerify, onBack, onResend, isSubmitting, error }: VerifyStepProps) {
  const [code, setCode] = useState('');

  // Resend has its own local status — separate from `isSubmitting`/`error`,
  // which cover the final verify-and-create-account submission, not this.
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onVerify(code);
  }

  async function handleResend() {
    setResendError(null);
    setResendStatus('sending');
    try {
      await onResend();
      setResendStatus('sent');
      // Drop the "Sent!" confirmation after a moment so the button becomes
      // clickable again if the user needs a third attempt.
      setTimeout(() => setResendStatus('idle'), 3000);
    } catch {
      setResendStatus('idle');
      setResendError('Could not resend the code. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-brass mb-2">Last step</div>
      <h1 className="text-[28px] mb-1">Verify your email</h1>
      <p className="text-sm text-ink-soft mb-6">
        We sent a 6-digit code to <span className="text-ink font-medium">{email}</span>.
      </p>

      <OtpInput value={code} onChange={setCode} length={6} />

      {error && (
        <div className="rounded-md border border-red/30 bg-red-wash text-red text-sm px-4 py-3 mt-5">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={code.length < 6 || isSubmitting}
        className={primaryBtnClass + ' w-full mt-7' + (isSubmitting ? ' opacity-70 cursor-not-allowed' : '')}
      >
        {isSubmitting ? 'Verifying…' : 'Verify & create account →'}
      </button>

      <div className="flex justify-between items-center mt-5 text-[13px]">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="text-ink-soft underline underline-offset-4">
          ← Back to review
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendStatus === 'sending' || isSubmitting}
          className="text-green font-semibold underline underline-offset-4 disabled:opacity-60"
        >
          {resendStatus === 'sending' ? 'Sending…' : resendStatus === 'sent' ? 'Sent!' : 'Resend code'}
        </button>
      </div>
      {resendError && <div className="text-red text-xs mt-2 text-right">{resendError}</div>}
    </form>
  );
}