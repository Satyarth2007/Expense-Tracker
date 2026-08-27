interface StepDotsProps {
  total: number;
  current: number; // 1-indexed
}

export default function StepDots({ total, current }: StepDotsProps) {
  return (
    <div className="flex gap-2 mb-7">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex-1 h-1 rounded-full bg-rule-soft overflow-hidden">
          <div
            className="h-full bg-green rounded-full transition-[width] duration-300 ease-out"
            style={{ width: step < current ? '100%' : step === current ? '60%' : '0%' }}
          />
        </div>
      ))}
    </div>
  );
}