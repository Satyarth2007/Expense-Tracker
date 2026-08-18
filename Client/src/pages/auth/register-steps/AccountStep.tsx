import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { inputClass, primaryBtnClass } from '../../../components/ui/styles';
import type { AccountData } from '../../../pages/auth/Register';

interface AccountStepProps {
  data: AccountData;
  onChange: (data: AccountData) => void;
  onNext: () => void;
}

export default function AccountStep({ data, onChange, onNext }: AccountStepProps) {
  function update<K extends keyof AccountData>(key: K, value: AccountData[K]) {
    onChange({ ...data, [key]: value });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-brass mb-2">Get started</div>
      <h1 className="text-[28px] mb-6">Create your account</h1>

      <div className="mb-4">
        <label className="block font-mono text-[11px] tracking-wide uppercase text-ink-soft mb-1.5">Full name</label>
        <input required type="text" value={data.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Satyarth Rao" className={inputClass} />
      </div>
      <div className="mb-4">
        <label className="block font-mono text-[11px] tracking-wide uppercase text-ink-soft mb-1.5">Email address</label>
        <input required type="email" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className={inputClass} />
      </div>
      <div className="mb-4">
        <label className="block font-mono text-[11px] tracking-wide uppercase text-ink-soft mb-1.5">Password</label>
        <input required minLength={8} type="password" value={data.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 8 characters" className={inputClass} />
      </div>
      <div className="mb-6">
        <label className="block font-mono text-[11px] tracking-wide uppercase text-ink-soft mb-1.5">Confirm password</label>
        <input required type="password" value={data.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Re-enter your password" className={inputClass} />
      </div>

      <button type="submit" className={primaryBtnClass + ' w-full'}>Next →</button>

      <div className="text-center mt-5 text-[13.5px] text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="text-green font-semibold underline underline-offset-4">Sign in</Link>
      </div>
    </form>
  );
}