'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dumbbell, Users, CheckCircle2, Clock, ShieldCheck, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.role === 'ADMIN') {
          router.push('/admin');
          return;
        } else if (data.user?.role === 'MEMBER') {
          router.push('/dashboard');
          return;
        }
      }
    } catch {
      // Unauthenticated visitor
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 animate-pulse">
          <Dumbbell className="w-8 h-8" />
        </div>
        <div className="text-xs text-slate-400">Verifying session...</div>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950/40 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            Official Somaiya Hostel Gym Portal
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Ashtavakra Hostel Gym <br />
            <span className="gradient-text">Slot Booking & Attendance</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Welcome to the Ashtavakra Hostel Gym Portal.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {user ? (
              <Link
                href={user.role === 'ADMIN' ? '/admin' : '/dashboard'}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>{user.role === 'ADMIN' ? 'Go to Admin Control Center' : 'Go to My Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>Sign In to Book Slots</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/register"
                  className="px-6 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Register New Member
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Operating Schedule & Rules Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Gym Operating Hours</h3>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Morning Session</span>
                <p className="text-sm font-bold text-white mt-0.5">06:00 AM – 09:00 AM</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-700/60 rounded-lg text-xs font-medium text-slate-300">2 Slots</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Evening Session</span>
                <p className="text-sm font-bold text-white mt-0.5">04:00 PM – 09:00 PM</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-700/60 rounded-lg text-xs font-medium text-slate-300">3 Slots</span>
            </div>
          </div>
        </div>

        {/* Gym Rules */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Gym Code of Conduct</h3>
          </div>

          <ul className="space-y-2 text-xs text-slate-300 pt-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>Registration requires an approved <strong>@somaiya.edu</strong> email address.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>Book only slots you intend to attend (max 1 booking per day).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>Cancel at least 30 minutes in advance if you are unable to make your slot.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>Attendance is verified directly by the hostel gym administrator on duty.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
