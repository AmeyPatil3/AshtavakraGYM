'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Dumbbell,
  User,
  LogOut,
  Shield,
  CalendarCheck,
  LayoutDashboard,
  Calendar,
  History,
  UserCheck,
  BarChart3,
  Sliders,
  Users,
} from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    window.location.href = '/';
  };

  return (
    <>
      {/* Main Top Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href={user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/'}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="p-1.5 sm:p-2 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                Ashtavakra Gym
                <span className="text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 hidden xs:inline-block">
                  Somaiya Hostel
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden xs:block">Slot Reservation System</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {user ? (
              user.role === 'ADMIN' ? (
                /* Admin Desktop Links */
                <>
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      pathname === '/admin'
                        ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                        : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Control Center</span>
                  </Link>

                  <Link
                    href="/profile"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === '/profile'
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Account</span>
                  </Link>

                  <div className="h-5 w-px bg-slate-800 mx-1" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                /* Member Desktop Links */
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/book-slot"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === '/book-slot'
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Slot</span>
                  </Link>

                  <Link
                    href="/my-bookings"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === '/my-bookings'
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>My Bookings</span>
                  </Link>

                  <Link
                    href="/attendance"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === '/attendance'
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Attendance</span>
                  </Link>

                  <Link
                    href="/profile"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      pathname === '/profile'
                        ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Account</span>
                  </Link>

                  <div className="h-5 w-px bg-slate-800 mx-1" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </>
              )
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg shadow-md shadow-blue-600/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Right Action Header Buttons */}
          <div className="flex md:hidden items-center gap-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/40 border border-red-900/40 flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-[11px] font-bold">Logout</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar for Logged-In Users */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-2 py-1.5 shadow-2xl flex items-center justify-around">
          {user.role === 'ADMIN' ? (
            /* Admin Mobile Bottom Nav */
            <>
              <Link
                href="/admin"
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  pathname === '/admin' ? 'text-emerald-400 font-bold bg-emerald-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-[10px]">Admin</span>
              </Link>

              <Link
                href="/profile"
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                  pathname === '/profile' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Account</span>
              </Link>
            </>
          ) : (
            /* Member Mobile Bottom Nav */
            <>
              <Link
                href="/dashboard"
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                  pathname === '/dashboard' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px]">Home</span>
              </Link>

              <Link
                href="/book-slot"
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                  pathname === '/book-slot' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[10px]">Book</span>
              </Link>

              <Link
                href="/my-bookings"
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                  pathname === '/my-bookings' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-5 h-5" />
                <span className="text-[10px]">Bookings</span>
              </Link>

              <Link
                href="/attendance"
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                  pathname === '/attendance' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span className="text-[10px]">Status</span>
              </Link>

              <Link
                href="/profile"
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                  pathname === '/profile' ? 'text-blue-400 font-bold bg-blue-950/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[10px]">Profile</span>
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
