'use client';

import React, { useEffect, useState } from 'react';
import { History, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this slot booking?')) return;
    setActionMessage(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to cancel booking' });
        return;
      }

      setActionMessage({ type: 'success', text: data.message });
      fetchUserBookings();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error cancelling booking' });
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            My Bookings History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review all confirmed, waitlisted, and past gym slot reservations
          </p>
        </div>

        <button
          onClick={fetchUserBookings}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success' ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300' : 'bg-red-950/50 border-red-800/60 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === st
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading booking history...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No bookings found for the selected filter.</div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Slot Time</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Booking Status</th>
                  <th className="p-3">Attendance</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBookings.map((b) => (
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
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : b.status === 'CANCELLED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          b.attendance?.status === 'ATTENDED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : b.attendance?.status === 'NOT_ATTENDED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {b.attendance?.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950/80 border border-red-800/50 text-red-300 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
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
