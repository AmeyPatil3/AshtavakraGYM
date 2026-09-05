'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CheckCircle2, AlertTriangle, Users, Dumbbell, XCircle, ArrowRight, UserCheck, History, User } from 'lucide-react';

export default function MemberDashboard() {
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchUserBookings();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user?.role === 'ADMIN') {
          router.push('/admin');
          return;
        }
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rule: Exclude CANCELLED bookings from Total Sessions!
  const validBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
  const totalBooked = validBookings.length;
  const attendedCount = validBookings.filter((b) => b.attendance?.status === 'ATTENDED').length;
  const noShowCount = validBookings.filter((b) => b.attendance?.status === 'NOT_ATTENDED').length;
  const pendingCount = validBookings.filter((b) => !b.attendance || b.attendance?.status === 'PENDING').length;
  const attendancePercentage = totalBooked > 0 ? Math.round((attendedCount / totalBooked) * 100) : 100;

  // Upcoming Active Booking
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingBooking = validBookings.find((b) => b.slot.date >= todayStr);

  return (
    <div className="space-y-8 py-4">
      {/* Greeting Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 border border-slate-800 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome back, {user?.name || 'Member'}! 👋
        </h1>
      </div>

      {/* Session Metrics Cards (Excludes Cancelled Bookings) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Workout Session Metrics</h2>
          <span className="text-[11px] text-slate-500">* Cancelled sessions are not counted</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Sessions</span>
            <p className="text-3xl font-extrabold text-white">{totalBooked}</p>
            <p className="text-[10px] text-slate-500">Active Bookings (Confirmed/Completed)</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attended Sessions</span>
            <p className="text-3xl font-extrabold text-emerald-400">{attendedCount}</p>
            <p className="text-[10px] text-emerald-500/80">Marked Attended by Admin</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">No-Shows</span>
            <p className="text-3xl font-extrabold text-amber-400">{noShowCount}</p>
            <p className="text-[10px] text-amber-500/80">Missed Reserved Sessions</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Sessions</span>
            <p className="text-3xl font-extrabold text-blue-400">{pendingCount}</p>
            <p className="text-[10px] text-blue-400/80">Awaiting Attendance</p>
          </div>
        </div>
      </div>

      {/* Upcoming Active Booking Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Upcoming Active Reservation
          </h2>

          <Link
            href="/book-slot"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Book New Slot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading reservation status...</div>
        ) : upcomingBooking ? (
          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {upcomingBooking.slot.period} SESSION
              </span>
              <p className="text-xl font-extrabold text-white mt-1">
                {upcomingBooking.slot.date} ({upcomingBooking.slot.startTime} – {upcomingBooking.slot.endTime})
              </p>
              <p className="text-xs text-slate-400">
                Attendance will be marked by Admin on duty.
              </p>
            </div>

            <Link
              href="/my-bookings"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
            >
              Manage Booking
            </Link>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-400">You currently have no upcoming gym slot reservations.</p>
            <Link
              href="/book-slot"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md"
            >
              <Calendar className="w-4 h-4" />
              <span>Explore Available Slots</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
