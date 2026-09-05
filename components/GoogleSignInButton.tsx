'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertCircle, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface GoogleSignInButtonProps {
  mode?: 'login' | 'register';
  onGoogleVerified?: (email: string, name: string) => void;
}

// Feature Toggle: Set to true to re-enable Google Sign-In in future versions
export const ENABLE_GOOGLE_AUTH = false;

export default function GoogleSignInButton({ mode = 'login', onGoogleVerified }: GoogleSignInButtonProps) {
  if (!ENABLE_GOOGLE_AUTH) {
    return null;
  }
  const [showModal, setShowModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSubmit = async (e?: React.FormEvent, customEmail?: string, customName?: string) => {
    if (e) e.preventDefault();
    setError('');

    const targetEmail = (customEmail || googleEmail).trim().toLowerCase();
    const targetName = (customName || googleName).trim();

    if (!targetEmail) {
      setError('Please enter your @somaiya.edu Google email address');
      return;
    }

    if (!targetEmail.endsWith('@somaiya.edu') && !targetEmail.includes('somaiya')) {
      setError('Only official @somaiya.edu Google accounts are allowed');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName || targetEmail.split('@')[0].replace('.', ' '),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Google authentication failed');
        setLoading(false);
        return;
      }

      setLoading(false);
      setShowModal(false);

      if (data.registered) {
        // User already registered -> Logged in directly!
        router.push(data.redirectUrl || '/dashboard');
      } else {
        // User NOT registered -> Auto-fill details for registration
        if (onGoogleVerified) {
          onGoogleVerified(data.googleEmail, data.googleName);
        } else {
          router.push(
            `/register?googleEmail=${encodeURIComponent(data.googleEmail)}&googleName=${encodeURIComponent(
              data.googleName
            )}&googleVerified=true`
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google Sign-In');
      setLoading(false);
    }
  };

  const handleQuickSelect = (email: string, name: string) => {
    setGoogleEmail(email);
    setGoogleName(name);
    handleGoogleSubmit(undefined, email, name);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-850 text-white font-medium text-xs rounded-xl border border-slate-700/80 shadow-md transition-all flex items-center justify-center gap-3 hover:border-slate-600 group"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>

        <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
          {mode === 'login' ? 'Sign in with Somaiya Google ID' : 'Auto-fill with Somaiya Google ID'}
        </span>

        <span className="ml-auto text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          @somaiya.edu
        </span>
      </button>

      {/* Google Somaiya Sign-In Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Somaiya Auth</h3>
                  <p className="text-[11px] text-slate-400">Strictly restricted to @somaiya.edu accounts</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Somaiya Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Verma"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Somaiya Google Email (@somaiya.edu) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@somaiya.edu"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating with Google...</span>
                ) : (
                  <>
                    <span>Continue with Somaiya Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
