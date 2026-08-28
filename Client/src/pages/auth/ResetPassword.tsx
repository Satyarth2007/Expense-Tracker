import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import AuthIllustration from "../../components/ui/AuthIllustration";
import { useAuth, type ApiErrorResponse } from "../../context/AuthContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // No token in the URL at all — someone navigated here directly rather
  // than via the email link. Nothing to submit against.
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-[400px] text-center">
          <h1 className="text-2xl font-display font-semibold mb-2">Invalid reset link</h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
            This link is missing its token. Request a new password reset email and use the link
            from there.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center py-3 px-6 rounded-[3px] font-semibold text-sm"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token as string, newPassword);
      // Backend revokes every active session on a successful reset, so
      // there's no "already logged in" state to route into — straight to
      // login with a fresh success message instead.
      setShowSuccess(true);
    } catch (err) {
      // Covers an expired (30-min TTL) or already-used token, and any
      // Zod validation failure on the new password.
      const message = isAxiosError<ApiErrorResponse>(err) && err.response
        ? typeof err.response.data.error === "string"
          ? err.response.data.error
          : "Please check your new password and try again."
        : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-[400px] text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--color-green-wash)", color: "var(--color-green)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-semibold mb-2">Password reset</h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
            Your password has been changed. For your security, you've been signed out everywhere
            — please log in again with your new password.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-[3px] font-semibold text-sm"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
          >
            Go to sign in →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
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
            A fresh key<br />for the same ledger.
          </h2>
        </div>
        <AuthIllustration />
        <p
          className="relative italic text-base lg:text-lg max-w-[380px] font-display"
          style={{ color: "#D9CFB4" }}
        >
          "Choose something you'll remember — the book stays exactly as you left it."
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:p-10 md:p-12">
        <div className="w-full max-w-[400px]">
          <div
            className="text-xs font-mono uppercase tracking-wider mb-2.5"
            style={{ color: "var(--color-brass)" }}
          >
            Account recovery
          </div>
          <h1 className="text-2xl md:text-[26px] font-display font-semibold mb-1.5">
            Choose a new password
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
            This link expires 30 minutes after it was sent.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                className="block text-[11px] font-mono uppercase tracking-wide mb-1.5"
                style={{ color: "var(--color-ink-soft)" }}
              >
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-3 rounded-[3px] border text-[14.5px] focus:outline-none"
                style={{ borderColor: "var(--color-rule)", background: "var(--color-paper)" }}
              />
            </div>

            <div className="mb-5">
              <label
                className="block text-[11px] font-mono uppercase tracking-wide mb-1.5"
                style={{ color: "var(--color-ink-soft)" }}
              >
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-3 rounded-[3px] border text-[14.5px] focus:outline-none"
                style={{ borderColor: "var(--color-rule)", background: "var(--color-paper)" }}
              />
            </div>

            {error && (
              <div
                className="text-sm rounded-[3px] px-3.5 py-3 mb-5"
                style={{ background: "var(--color-red-wash)", color: "var(--color-red)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-[3px] font-semibold text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              {isSubmitting ? "Resetting…" : "Reset password →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}