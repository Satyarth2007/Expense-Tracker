import type { ReactNode } from 'react';
import StepDots from '../ui/StepDots';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  step: number;
  totalSteps: number;
  heading: ReactNode;
  supportingText?: ReactNode;
  illustration?: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({ step, totalSteps, heading, supportingText, illustration, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Mobile brand bar — shown when the dark side panel is hidden below lg */}
      <div className="lg:hidden flex items-center px-6 pt-6">
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full border"
            style={{ borderColor: 'var(--color-brass-light)', color: 'var(--color-brass-light)', fontFamily: 'var(--font-display)' }}
          >
            E
          </span>
          <span className="text-xl font-bold text-ink">ExpenseDekho</span>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Dark ledger panel */}
        <aside className="hidden lg:flex flex-1 flex-col justify-between bg-ink p-[52px] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 39px, var(--color-brass-light) 40px),
                                 repeating-linear-gradient(to right, transparent, transparent 119px, var(--color-brass-light) 120px)`,
            }}
          />

          <Link to="/" className="relative flex items-center gap-2.5" aria-label="Back to home">
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full border"
              style={{ borderColor: 'var(--color-brass-light)', color: 'var(--color-brass-light)', fontFamily: 'var(--font-display)' }}
            >
              E
            </span>
            <span className="text-xl font-bold text-brass-light">ExpenseDekho</span>
          </Link>

          <div className="relative">
            <h2 className="text-paper text-[30px] leading-[1.25] mb-4">{heading}</h2>
            {supportingText && <p className="relative italic text-[17px] text-[#D9CFB4] max-w-[380px]">{supportingText}</p>}
          </div>

          <div className="relative">{illustration ?? <DefaultIllustration />}</div>
        </aside>

        {/* Form side */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-[52px]">
          <div className="w-full max-w-[460px]">
            {totalSteps > 1 && (
              <>
                <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-faint mb-3">
                  Step {step} of {totalSteps}
                </div>
                <StepDots total={totalSteps} current={step} />
              </>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultIllustration() {
  const bars = [45, 75, 55, 95, 70, 85];

  return (
    <div>
      <style>{`
        @keyframes growBar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>
      <div className="flex gap-4 items-end h-[170px] border-b border-[rgba(201,154,86,0.25)] pb-3">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-7 rounded-t-md origin-bottom"
            style={{
              height: `${h}%`,
              background: 'linear-gradient(to top, var(--color-brass), var(--color-brass-light))',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
              animation: `growBar 1s cubic-bezier(0.2,0.8,0.3,1) ${i * 0.08}s both`,
            }}
          />
        ))}
      </div>
    </div>
  );
}