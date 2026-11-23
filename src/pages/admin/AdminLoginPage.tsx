import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { apiClient, ApiError } from '../../services/apiClient';
import { SeoHead } from '../../components/SeoHead';
import {
  ADMIN_BTN_PRIMARY,
  ADMIN_INPUT_CLASS,
  AdminField,
  AdminNotice,
} from './components/AdminPrimitives';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminConfigured, setAdminConfigured] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient
      .getAuthStatus()
      .then((res) => {
        if (!active) return;
        setAdminConfigured(res.adminConfigured);
        if (res.authenticated) {
          navigate('/admin/dashboard', { replace: true });
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.isNetworkError) {
          setApiUnavailable(true);
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
    setSubmitting(true);
    try {
      await apiClient.login(email.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title="Admin Sign In | MRM CMS"
        description="Sign in to manage MD ROBIN MIA website content."
        noIndex
      />

      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F8F8] px-4 py-12 dark:bg-[#050505]">
        <div className="w-full max-w-md rounded-[8px] border border-[#EAEAEA] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#111111]">
          <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4 dark:border-[#222222]">
            <div>
              <p className="font-mono-tabular text-[11px] font-medium tracking-[0.14em] text-[#707070] uppercase dark:text-[#A3A3A3]">
                MRM. CMS
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[#000000] dark:text-white">
                Admin Sign In
              </h1>
            </div>
            <Lock className="h-5 w-5 text-[#111111] dark:text-white" aria-hidden="true" />
          </div>

          {checking ? (
            <div className="py-8 text-center text-xs text-[#707070] dark:text-[#A3A3A3]">
              Checking session...
            </div>
          ) : apiUnavailable ? (
            <div className="mt-5 space-y-4">
              <AdminNotice
                type="error"
                message="CMS backend API is not reachable from this preview environment. Configure the Cloudflare Worker + D1 deployment or local Wrangler dev server to sign in."
              />
              <Link
                to="/"
                className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold tracking-wider text-[#111111] uppercase hover:underline dark:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Return to Public Site</span>
              </Link>
            </div>
          ) : !adminConfigured ? (
            <div className="mt-5 space-y-4">
              <AdminNotice
                type="info"
                message="No administrator account has been created yet. Complete first-time bootstrap setup first."
              />
              <Link to="/admin/setup" className={`${ADMIN_BTN_PRIMARY} w-full`}>
                Go to Initial Setup
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <AdminNotice type="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />

              <AdminField label="Email Address" htmlFor="login-email">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                  placeholder="you@domain.com"
                />
              </AdminField>

              <AdminField label="Password" htmlFor="login-password">
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={ADMIN_INPUT_CLASS}
                />
              </AdminField>

              <button type="submit" disabled={submitting} className={`${ADMIN_BTN_PRIMARY} w-full`}>
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="border-t border-[#EAEAEA] pt-4 text-center dark:border-[#222222]">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs text-[#707070] hover:text-[#111111] dark:text-[#A3A3A3] dark:hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Back to Public Website</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
