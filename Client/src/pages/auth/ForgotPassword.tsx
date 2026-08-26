import { useState } from "react";
import { Link } from "react-router-dom";
import AuthIllustration from "../../components/ui/AuthIllustration";

type Step = "email" | "reset";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");

  return (
    <div className="flex min-h-screen">
      {/* ---------- Left panel ---------- */}
      <div
        className="hidden md:flex flex-1 flex-col justify-between p-13 relative overflow-hidden"
        style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 39px, var(--color-brass-light) 40px),
              repeating-linear-gradient(to right, transparent, transparent 119px, var(--color-brass-light) 120px)`,
          }}
        />

        <div className="relative">
          <div
            className="text-xs font-mono uppercase tracking-widest mb-2.5"
            style={{ color: "var(--color-brass-light)" }}
          >
            Account recovery
          </div>
          <h2 className="text-3xl leading-tight font-display font-semibold" style={{ color: "var(--color-paper)" }}>
            Forgotten passwords<br />happen to everyone.
          </h2>
        </div>

        <AuthIllustration />

        <p
          className="relative italic text-lg max-w-[380px] font-display"
          style={{ color: "#D9CFB4" }}
        >
          "A misplaced key doesn't mean a lost ledger — just a new one, carefully re-issued."
        </p>
      </div>

      {/* ---------- Right panel ---------- */}
      <div className="flex-1 flex items-center justify-center p-13">
        <div className="w-full max-w-[400px]">

          <div className="flex gap-2 mb-7">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-rule-soft)" }}>
              <div className="h-full rounded-full" style={{ background: "var(--color-green)", width: "100%" }} />
            </div>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-rule-soft)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ background: "var(--color-green)", width: step === "reset" ? "100%" : "0%" }}
              />
            </div>
          </div>

          <div
            className="text-xs font-mono uppercase tracking-wider mb-2.5"
            style={{ color: "var(--color-brass)" }}
          >
            {step === "email" ? "Step 1 of 2" : "Step 2 of 2"}
          </div>

          {step === "email" ? (
            <>
              <h1 className="text-[26px] font-display font-semibold mb-1.5">Forgot your password?</h1>
              <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
                Enter the email tied to your ledger — we'll send a verification code.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); setStep("reset"); }}>
                <div className="mb-4.5">
                  <label
                    className="block text-[11px] font-mono uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-3 rounded-[3px] border text-[14.5px] transition-colors focus:outline-none"
                    style={{ borderColor: "var(--color-rule)", background: "var(--color-paper)" }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-[3px] font-semibold text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
                >
                  Send verification code →
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[26px] font-display font-semibold mb-1.5">Check your email</h1>
              <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
                We sent a 6-digit code to <strong>your inbox</strong>. It expires in 5 minutes.
              </p>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="mb-4.5">
                  <label
                    className="block text-[11px] font-mono uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-3.5 py-3 rounded-[3px] border text-[14.5px] text-center tracking-[0.35em] focus:outline-none"
                    style={{ borderColor: "var(--color-rule)", background: "var(--color-paper)" }}
                  />
                </div>

                <div className="mb-4.5">
                  <label
                    className="block text-[11px] font-mono uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    New password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-3 rounded-[3px] border text-[14.5px] focus:outline-none"
                    style={{ borderColor: "var(--color-rule)", background: "var(--color-paper)" }}
                  />
                </div>

                <div className="mb-5.5">
                  <label
                    className="block text-[11px] font-mono uppercase tracking-wide mb-1.5"
                    style={{ color: "var(--color-ink-soft)" }}
                  >
                    Confirm password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-3 rounded-[3px] border text-[14.5px] focus:outline-none"
                    style={{ borderColor: "var(--color-rule)", background: "var(--color-paper)" }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-[3px] font-semibold text-sm transition-transform hover:-translate-y-0.5"
                  style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
                >
                  Reset password →
                </button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-center text-xs mt-3.5"
                  style={{ color: "var(--color-ink-soft)" }}
                >
                  ← Use a different email
                </button>
              </form>
            </>
          )}

          <div className="text-center mt-6 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            Remembered it?{" "}
            <Link to="/login" className="font-semibold underline underline-offset-4" style={{ color: "var(--color-green)" }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}