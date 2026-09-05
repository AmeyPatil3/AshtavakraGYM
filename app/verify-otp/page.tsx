'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const otpParam = searchParams.get('otp') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState(otpParam);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (otpParam) {
      setOtpCode(otpParam);
    }
  }, [otpParam]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      // Auto-logged in! Redirect to member dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">Email OTP Verification</h1>
        <p className="text-xs text-slate-400">
          Enter the 6-digit verification code sent to <span className="text-slate-200 font-mono">{email}</span>
        </p>
      </div>

      {otpParam && (
        <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-blue-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Simulated OTP Code: <strong className="font-mono text-white text-sm">{otpParam}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setOtpCode(otpParam)}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-[11px]"
          >
            Auto Fill
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Somaiya Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit OTP Code</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-center text-xl tracking-widest font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{loading ? 'Verifying...' : 'Verify & Activate Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
