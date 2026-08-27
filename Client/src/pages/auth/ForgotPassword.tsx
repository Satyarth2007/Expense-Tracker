import { useState } from "react";
import { Link } from "react-router-dom";
import AuthIllustration from "../../components/ui/AuthIllustration";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // TODO: call POST /auth/forgot-password with { email }
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* ---------- Left panel ---------- */}
      <div
        className="hidden md:flex flex-1 flex-col justify-between p-8 lg:p-12 relative overflow-hidden"
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
          <h2
            className="text-2xl lg:text-3xl leading-tight font-display font-semibold"
            style={{ color: "var(--color-paper)" }}
          >
            Forgotten passwords<br />happen to everyone.
          </h2>
        </div>

        <AuthIllustration />

        <p
          className="relative italic text-base lg:text-lg max-w-[380px] font-display"
          style={{ color: "#D9CFB4" }}
        >
          "A misplaced key doesn't mean a lost ledger — just a new one, carefully re-issued."
        </p>
      </div>

      {/* ---------- Right panel ---------- */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:p-10 md:p-12">
        <div className="w-full max-w-[400px]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold mb-8 md:mb-10"
            style={{ color: "var(--color-ink-soft)" }}
            aria-label="Back to home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>

          <div
            className="text-xs font-mono uppercase tracking-wider mb-2.5"
            style={{ color: "var(--color-brass)" }}
          >
            Account recovery
          </div>

          <h1 className="text-2xl md:text-[26px] font-display font-semibold mb-1.5">
            Forgot your password?
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
            Enter the email tied to your ledger — we'll send you a link to reset it.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                className="block text-[11px] font-mono uppercase tracking-wide mb-1.5"
                style={{ color: "var(--color-ink-soft)" }}
              >
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-3 rounded-[3px] border text-[14.5px] transition-colors focus:outline-none"
                style={{ borderColor: "var(--color-rule)", background: "var(--color-paper)" }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-[3px] font-semibold text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              {isSubmitting ? "Sending…" : "Send reset link →"}
            </button>
          </form>

          <div className="text-center mt-6 text-sm" style={{ color: "var(--color-ink-soft)" }}>
            Remembered it?{" "}
            <Link
              to="/login"
              className="font-semibold underline underline-offset-4"
              style={{ color: "var(--color-green)" }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* ---------- Success popup ---------- */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(34, 31, 26, 0.55)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-sent-title"
        >
          <div
            className="w-full max-w-[380px] rounded-[6px] p-7 text-center relative"
            style={{
              background: "var(--color-paper)",
              border: "1px solid var(--color-rule-soft)",
              boxShadow: "0 10px 30px rgba(34,31,26,0.25)",
            }}
          >
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              aria-label="Close"
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full"
              style={{ color: "var(--color-ink-soft)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>

            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "var(--color-green-wash)", color: "var(--color-green)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 id="reset-sent-title" className="text-xl font-display font-semibold mb-2">
              Check your inbox
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
              We've sent a password reset link to <strong>{email || "your email"}</strong>. Click
              the link to choose a new password — it expires in 15 minutes.
            </p>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center py-3 rounded-[3px] font-semibold text-sm transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              Back to sign in
            </Link>

            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="w-full text-center text-xs mt-3.5"
              style={{ color: "var(--color-ink-soft)" }}
            >
              Use a different email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}