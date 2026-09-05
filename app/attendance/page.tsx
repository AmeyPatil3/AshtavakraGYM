'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export default function AttendancePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserBookings();
  }, []);

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

  // Exclude CANCELLED bookings per user rule!
  const validBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
  const totalBooked = validBookings.length;
  const attendedCount = validBookings.filter((b) => b.attendance?.status === 'ATTENDED').length;
  const noShowCount = validBookings.filter((b) => b.attendance?.status === 'NOT_ATTENDED').length;
  const pendingCount = validBookings.filter((b) => !b.attendance || b.attendance?.status === 'PENDING').length;
  const attendancePercentage = totalBooked > 0 ? Math.round((attendedCount / totalBooked) * 100) : 100;

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-400" />
            Attendance History & Metrics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your workout consistency and attendance logs.
          </p>
        </div>

        <button
          onClick={fetchUserBookings}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Attendance</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
          <p className="text-3xl font-extrabold text-emerald-400">{attendancePercentage}%</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Sessions</span>
          <p className="text-3xl font-extrabold text-white">{totalBooked}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attended Sessions</span>
          <p className="text-3xl font-extrabold text-emerald-400">{attendedCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">No-Shows</span>
          <p className="text-3xl font-extrabold text-amber-400">{noShowCount}</p>
        </div>
      </div>

      {/* Detailed Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading attendance history...</div>
      ) : validBookings.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No active gym sessions recorded yet.</div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Slot Time</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Attendance Status</th>
                  <th className="p-3 text-right">Marked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {validBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-850/50">
                    <td className="p-3 font-semibold text-white">{b.slot.date}</td>
                    <td className="p-3 font-mono">{b.slot.startTime} – {b.slot.endTime}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                        {b.slot.period}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${b.attendance?.status === 'ATTENDED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : b.attendance?.status === 'NOT_ATTENDED'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                      >
                        {b.attendance?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-400 font-mono text-[11px]">
                      {b.attendance?.markedBy || 'Pending Admin Review'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
