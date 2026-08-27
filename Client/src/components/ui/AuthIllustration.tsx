export default function AuthIllustration() {
  return (
    <div className="relative flex items-center justify-center py-8">
      <svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes ed-rotate-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes ed-pulse {
              0%   { transform: scale(0.85); opacity: 0.5; }
              70%  { transform: scale(1.25); opacity: 0; }
              100% { transform: scale(1.25); opacity: 0; }
            }
            @keyframes ed-drift {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-5px); }
            }
            .ed-ring-rotate {
              transform-origin: 130px 130px;
              animation: ed-rotate-slow 40s linear infinite;
            }
            .ed-pulse-ring {
              transform-origin: 130px 148px;
              animation: ed-pulse 3s ease-out infinite;
            }
            .ed-pulse-ring.delay {
              animation-delay: 1.5s;
            }
            .ed-envelope {
              animation: ed-drift 4s ease-in-out infinite;
              transform-origin: 200px 78px;
            }
          `}
        </style>

        {/* outer dial ring with tick marks */}
        <g className="ed-ring-rotate">
          <circle
            cx="130"
            cy="130"
            r="108"
            stroke="var(--color-brass-light)"
            strokeOpacity="0.22"
            strokeWidth="1"
            strokeDasharray="1 7"
          />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 130 + 100 * Math.sin(angle);
            const y1 = 130 - 100 * Math.cos(angle);
            const x2 = 130 + 108 * Math.sin(angle);
            const y2 = 130 - 108 * Math.cos(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-brass)"
                strokeOpacity={i % 3 === 0 ? 0.55 : 0.2}
                strokeWidth={i % 3 === 0 ? 1.5 : 1}
              />
            );
          })}
        </g>

        {/* inner static ring */}
        <circle
          cx="130"
          cy="130"
          r="82"
          stroke="var(--color-brass-light)"
          strokeOpacity="0.18"
          strokeWidth="1"
        />

        {/* signal pulses radiating from the lock */}
        <circle className="ed-pulse-ring" cx="130" cy="148" r="30" stroke="var(--color-brass-light)" strokeWidth="1.5" fill="none" />
        <circle className="ed-pulse-ring delay" cx="130" cy="148" r="30" stroke="var(--color-brass-light)" strokeWidth="1.5" fill="none" />

        {/* padlock */}
        <g>
          <rect
            x="97"
            y="128"
            width="66"
            height="52"
            rx="7"
            stroke="var(--color-brass-light)"
            strokeWidth="2.5"
            fill="var(--color-ink)"
          />
          <path
            d="M108 128v-16a22 22 0 0 1 44 0v16"
            stroke="var(--color-brass-light)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* rivets */}
          <circle cx="103" cy="134" r="1.6" fill="var(--color-brass-light)" fillOpacity="0.6" />
          <circle cx="157" cy="134" r="1.6" fill="var(--color-brass-light)" fillOpacity="0.6" />
          {/* keyhole */}
          <circle cx="130" cy="149" r="6.5" fill="var(--color-brass-light)" />
          <path d="M130 155v9" stroke="var(--color-brass-light)" strokeWidth="4" strokeLinecap="round" />
        </g>

        {/* dotted path from envelope to lock */}
        <path
          d="M188 82 C 165 100, 150 112, 138 124"
          stroke="var(--color-brass-light)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          fill="none"
        />

        {/* envelope with code, floating */}
        <g className="ed-envelope">
          <rect
            x="178"
            y="60"
            width="44"
            height="32"
            rx="4"
            stroke="var(--color-brass-light)"
            strokeWidth="2"
            fill="var(--color-ink)"
          />
          <path
            d="M179 62l21 15 21-15"
            stroke="var(--color-brass-light)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <text
            x="200"
            y="105"
            textAnchor="middle"
            fontFamily="var(--font-mono, monospace)"
            fontSize="9"
            letterSpacing="2"
            fill="var(--color-brass-light)"
            fillOpacity="0.75"
          >
            •••••
          </text>
        </g>

        {/* corner accent ticks, echoes ledger ruled-corner motif */}
        <path d="M18 40v-14h14" stroke="var(--color-brass-light)" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
        <path d="M242 220v14h-14" stroke="var(--color-brass-light)" strokeOpacity="0.35" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}