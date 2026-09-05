'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Mail, Lock, User, Phone, AlertCircle, Dumbbell, CheckCircle2, Sparkles } from 'lucide-react';
import GoogleSignInButton, { ENABLE_GOOGLE_AUTH } from '@/components/GoogleSignInButton';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    memberId: '',
    gymMembershipId: '',
    name: '',
    email: '',
    phone: '',
    bloodGroup: 'O+',
    password: '',
    confirmPassword: '',
  });

  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const gEmail = searchParams.get('googleEmail');
    const gName = searchParams.get('googleName');
    const gVerified = searchParams.get('googleVerified');

    if (gEmail) {
      setFormData((prev) => ({
        ...prev,
        email: gEmail,
        name: gName || prev.name,
      }));
    }
    if (gVerified === 'true') {
      setIsGoogleVerified(true);
    }
  }, [searchParams]);

  const handleGoogleAutoFill = (email: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      email,
      name: name || prev.name,
    }));
    setIsGoogleVerified(true);
    setError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('@somaiya.edu')) {
      setError('Only official @somaiya.edu email addresses are permitted.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          googleVerified: isGoogleVerified,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Success -> Instant login and redirect to member dashboard
      router.push(data.redirectUrl || '/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 mb-2">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">Create Member Account</h1>
        <p className="text-xs text-slate-400">Exclusive registration for Ashtavakra Hostel residents</p>
      </div>

      {/* Google Auto-Fill Section */}
      {ENABLE_GOOGLE_AUTH && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Fast Google Somaiya Registration</span>
            </span>
            <span className="text-[10px] text-slate-500">Auto-fills Name & Email</span>
          </div>
          <GoogleSignInButton mode="register" onGoogleVerified={handleGoogleAutoFill} />
        </div>
      )}

      {isGoogleVerified && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <div className="font-bold">Google Somaiya Account Verified!</div>
            <div className="text-[11px] text-emerald-300/80">
              Your email ({formData.email}) and name have been auto-filled from Google. Complete your Somaiya ID Card number, Phone, and Password to finish registering.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Somaiya ID Card Number *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="memberId"
                  required
                  placeholder="e.g. 15110220045"
                  value={formData.memberId}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gym Membership ID *</label>
              <div className="relative">
                <Dumbbell className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="gymMembershipId"
                  required
                  placeholder="153"
                  value={formData.gymMembershipId}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Student Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Somaiya Email Address *</label>
              {isGoogleVerified && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Google Verified
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                readOnly={isGoogleVerified}
                placeholder="user@somaiya.edu"
                value={formData.email}
                onChange={handleChange}
                className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder:text-slate-500 ${
                  isGoogleVerified ? 'border-emerald-500/60 bg-emerald-950/20 font-mono' : 'border-slate-700/80 focus:border-blue-500'
                }`}
              />
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-1">Must be an authorized @somaiya.edu domain address.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Blood Group</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Complete Registration'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-400">
        Already registered?{' '}
        <Link href="/login" className="text-blue-400 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-400 text-xs">Loading registration...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
