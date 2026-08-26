import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      step={1}
      totalSteps={1}
      heading="Every rupee, entered in its proper column."
      supportingText="The ledger doesn't judge — it just remembers, more reliably than you do."
    >
      <div className="font-mono text-[11px] uppercase tracking-wider text-brass mb-2">
        Welcome back
      </div>
      <h1 className="text-[28px] font-semibold mb-6 text-ink">
        Sign in to your ledger
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-[18px]">
          <label htmlFor="email" className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                       focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-wash)]"
          />
        </div>

        <div className="mb-[18px]">
          <label htmlFor="password" className="block font-mono text-[11px] uppercase tracking-wider text-ink-soft mb-[7px]">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-[13px] py-3 border border-rule rounded-[3px] bg-paper text-[14.5px] text-ink
                       focus:outline-none focus:border-green focus:shadow-[0_0_0_3px_var(--color-green-wash)]"
          />
        </div>

        <div className="flex justify-between items-center -mt-1 mb-[22px] text-[13px]">
          <label className="flex items-center gap-[7px] text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
              className="w-auto"
            />
            Remember me
          </label>
          <Link to="/forget-password" className="text-green font-semibold">
            Forget password?
          </Link>
        </div>

        {error && (
          <div className="text-red text-[13px] mb-4" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 px-5 py-[11px] rounded-[3px]
                     border border-ink bg-ink text-paper text-[14px] font-semibold
                     hover:-translate-y-[2px] hover:shadow-lg transition-transform
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? 'Signing in…' : 'Sign in →'}
        </button>

        <div className="text-center mt-5 text-[13.5px] text-ink-soft">
          New to ExpenseDekho?{' '}
          <Link to="/register" className="text-green font-semibold underline underline-offset-[3px]">
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}