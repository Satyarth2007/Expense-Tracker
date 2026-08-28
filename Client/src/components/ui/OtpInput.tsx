import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export default function OtpInput({ value, onChange, length = 6 }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function setDigit(index: number, raw: string) {
    const clean = raw.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[index] = clean;
    onChange(next.join(''));
    if (clean && index < length - 1) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  // Handles pasting a full OTP (e.g. copied from an email) into any box.
  // Without this, setDigit's slice(-1) would keep only the last pasted
  // character and silently drop the rest.
  function handlePaste(index: number, e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();

    const next = digits.slice();
    let cursor = index;
    for (const char of pasted) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor++;
    }
    onChange(next.join(''));

    const focusIndex = Math.min(cursor, length - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="flex gap-2.5">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          className="w-[44px] h-[52px] text-center text-lg font-mono rounded-sm border border-rule bg-paper text-ink
                     focus:outline-none focus:border-green focus:ring-4 focus:ring-green-wash"
        />
      ))}
    </div>
  );
}