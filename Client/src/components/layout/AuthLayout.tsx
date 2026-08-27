import { useState, type ReactNode } from 'react';
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

const CHART_DATA = [
  { month: 'Mar', value: 82, amount: '₹1,04,200' },
  { month: 'Apr', value: 65, amount: '₹96,800' },
  { month: 'May', value: 55, amount: '₹88,300' },
  { month: 'Jun', value: 95, amount: '₹1,21,400' },
  { month: 'Jul', value: 70, amount: '₹1,02,900' },
  { month: 'Aug', value: 85, amount: '₹1,13,600' },
];

function DefaultIllustration() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="w-full">
      <style>{`
        @keyframes growBar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translate(-50%, 4px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div className="flex justify-start gap-3 sm:gap-4 lg:gap-5 items-end h-[130px] sm:h-[150px] lg:h-[170px] w-full border-b border-[rgba(201,154,86,0.25)] pb-3">
        {CHART_DATA.map((d, i) => {
          const isHovered = hovered === i;
          return (
            <div
              key={d.month}
              className="relative flex flex-col items-center justify-end h-full w-6 sm:w-7"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[3px] px-2 sm:px-2.5 py-1 sm:py-1.5 text-center"
                  style={{
                    background: 'var(--color-brass-light)',
                    color: 'var(--color-ink)',
                    animation: 'tooltipIn 0.15s ease both',
                  }}
                >
                  <div
                    className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide"
                    style={{ opacity: 0.75 }}
                  >
                    {d.month}
                  </div>
                  <div className="font-mono text-[11px] sm:text-[12px] font-semibold leading-tight">
                    {d.amount}
                  </div>
                  {/* Little pointer */}
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2"
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid var(--color-brass-light)',
                    }}
                  />
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-md origin-bottom cursor-pointer transition-[transform,filter] duration-200"
                style={{
                  height: `${d.value}%`,
                  background: isHovered
                    ? 'linear-gradient(to top, var(--color-brass-light), #E4B876)'
                    : 'linear-gradient(to top, var(--color-brass), var(--color-brass-light))',
                  boxShadow: isHovered ? '0 10px 22px rgba(0,0,0,0.35)' : '0 6px 18px rgba(0,0,0,0.25)',
                  transform: isHovered ? 'scaleY(1.04)' : 'scaleY(1)',
                  animation: `growBar 1s cubic-bezier(0.2,0.8,0.3,1) ${i * 0.08}s both`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}