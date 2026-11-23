import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { apiClient, ApiError } from '../../services/apiClient';
import { SeoHead } from '../../components/SeoHead';
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_INPUT_CLASS,
  AdminField,
  AdminNotice,
} from './components/AdminPrimitives';

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminConfigured, setAdminConfigured] = useState(false);
  const [bootstrapConfigured, setBootstrapConfigured] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [displayName, setDisplayName] = useState('MD Robin Mia');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient
      .getAuthStatus()
      .then((res) => {
        if (!active) return;
        setAdminConfigured(res.adminConfigured);
        setBootstrapConfigured(res.bootstrapConfigured);
        if (res.authenticated) {
          navigate('/admin/dashboard', { replace: true });
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.isNetworkError) {
          setApiUnavailable(true);
        } else {
          setErrorMsg(err instanceof Error ? err.message : 'Unable to check setup status.');
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.setupAdmin({
        bootstrapSecret: bootstrapSecret.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize admin account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Admin Initial Setup | MRM CMS"
        description="One-time administrator bootstrap setup."
        noIndex
      />

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F8F8] px-4 py-12 dark:bg-[#050505]">
        <div className="w-full max-w-md rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4 dark:border-[#222222]">
            <div>
              <p className="font-mono-tabular text-[11px] font-medium tracking-[0.14em] text-[#707070] uppercase dark:text-[#A3A3A3]">
                MRM. CMS Bootstrap
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[#000000] dark:text-white">
                First-Time Admin Setup
              </h1>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#111111] dark:text-white" aria-hidden="true" />
          </div>

          {checking ? (
            <div className="py-8 text-center text-xs text-[#707070] dark:text-[#A3A3A3]">
              Verifying CMS backend status...
            </div>
          ) : apiUnavailable ? (
            <div className="mt-5 space-y-4">
              <AdminNotice
                type="error"
                message="Cloudflare Worker API is not connected on this origin. Deploy the Worker (`worker/`) with D1 migrations and bind it to Cloudflare Pages (`/api/*`) or set `VITE_API_BASE_URL` before running initial setup."
              />
              <Link
                to="/"
                className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold tracking-wider text-[#111111] uppercase hover:underline dark:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Return to Public Site</span>
              </Link>
            </div>
          ) : adminConfigured ? (
            <div className="mt-5 space-y-4">
              <AdminNotice
                type="info"
                message="Administrator setup is already complete. Public registration is permanently disabled."
              />
              <Link to="/admin/login" className={`${ADMIN_BTN_PRIMARY} w-full`}>
                Proceed to Admin Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {!bootstrapConfigured && (
                <AdminNotice
                  type="error"
                  message="ADMIN_BOOTSTRAP_SECRET is not configured on the Worker yet. Run `npx wrangler secret put ADMIN_BOOTSTRAP_SECRET` before submitting."
                />
              )}

              <AdminNotice type="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />

              <AdminField
                label="Bootstrap Secret"
                htmlFor="setup-secret"
                hint="Must match your Cloudflare Worker secret ADMIN_BOOTSTRAP_SECRET."
              >
                <input
                  id="setup-secret"
                  type="password"
                  required
                  value={bootstrapSecret}
                  onChange={(e) => setBootstrapSecret(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                  placeholder="Enter Worker bootstrap secret"
                />
              </AdminField>

              <AdminField label="Display Name" htmlFor="setup-name">
                <input
                  id="setup-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField label="Admin Email" htmlFor="setup-email">
                <input
                  id="setup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                  placeholder="you@domain.com"
                />
              </AdminField>

              <AdminField
                label="Password"
                htmlFor="setup-password"
                hint="Minimum 10 characters with uppercase, lowercase, and at least one number."
              >
                <input
                  id="setup-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <AdminField label="Confirm Password" htmlFor="setup-password-confirm">
                <input
                  id="setup-password-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <button
                type="submit"
                disabled={submitting || !bootstrapConfigured}
                className={`${ADMIN_BTN_PRIMARY} w-full`}
              >
                {submitting ? 'Creating Owner Account...' : 'Create Owner Account'}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
