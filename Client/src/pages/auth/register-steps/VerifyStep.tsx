import { useState, type FormEvent } from 'react';
import OtpInput from '../../../components/ui/OtpInput.tsx';
import { primaryBtnClass } from '../../../components/ui/styles.ts';

interface VerifyStepProps {
  email: string;
  onVerify: (code: string) => void;
  onBack: () => void;
}

export default function VerifyStep({ email, onVerify, onBack }: VerifyStepProps) {
  const [code, setCode] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onVerify(code);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-brass mb-2">Last step</div>
      <h1 className="text-[28px] mb-1">Verify your email</h1>
      <p className="text-sm text-ink-soft mb-6">
        We sent a 6-digit code to <span className="text-ink font-medium">{email}</span>.
      </p>

      <OtpInput value={code} onChange={setCode} length={6} />

      <button type="submit" disabled={code.length < 6} className={primaryBtnClass + ' w-full mt-7'}>
        Verify & create account →
      </button>

      <div className="flex justify-between items-center mt-5 text-[13px]">
        <button type="button" onClick={onBack} className="text-ink-soft underline underline-offset-4">← Back to review</button>
        <button type="button" className="text-green font-semibold underline underline-offset-4">Resend code</button>
      </div>
    </form>
  );
}