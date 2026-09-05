'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, AlertTriangle, RefreshCw, Dumbbell } from 'lucide-react';

export default function BookSlotPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  const fetchSlots = async (date: string) => {
    setLoading(true);
    setIsClosed(false);
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isClosed) {
          setIsClosed(true);
          setClosedMessage(data.message);
          setSlots([]);
        } else {
          setSlots(data.slots || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId: string) => {
    setActionMessage(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to book slot' });
        return;
      }

      setActionMessage({ type: 'success', text: data.message });
      fetchSlots(selectedDate);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error executing booking' });
    }
  };

  const dateOptions = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isSun = d.getDay() === 0;
    const baseLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const label = isSun ? `${baseLabel} (Closed)` : baseLabel;
    return { dateStr, label, isSunday: isSun };
  });

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Book Gym Slot
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Operating Days: <strong>Monday to Saturday</strong> (06:00–09:00 Morning, 16:00–21:00 Evening).
          </p>
        </div>

        <button
          onClick={() => fetchSlots(selectedDate)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Vacancies</span>
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

      {/* Date Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {dateOptions.map((opt) => (
          <button
            key={opt.dateStr}
            onClick={() => setSelectedDate(opt.dateStr)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDate === opt.dateStr
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20 scale-105'
                : opt.isSunday
                ? 'bg-slate-950/80 text-amber-400/70 border border-amber-500/20 hover:bg-slate-900'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Slot Grid / Closed State */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading available gym slots...</div>
      ) : isClosed ? (
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Gym Closed Today (Sunday)</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {closedMessage || 'The Ashtavakra Hostel Gym is closed on Sundays for weekly maintenance. Operating sessions resume Monday morning at 06:00 AM.'}
          </p>
        </div>
      ) : slots.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">No active slots scheduled for {selectedDate}.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const isFull = slot.isFull;
            const isExpired = slot.isExpired;
            const isUserBooked = slot.isUserBooked;
            const isUserWaitlisted = slot.isUserWaitlisted;

            return (
              <div
                key={slot.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isUserBooked
                    ? 'bg-blue-950/30 border-blue-600/50 shadow-lg shadow-blue-600/10'
                    : isExpired
                    ? 'bg-slate-950/70 border-slate-800/80 opacity-60'
                    : isFull
                    ? 'bg-slate-900/40 border-slate-800 opacity-90'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {slot.period} SESSION
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isExpired
                          ? 'bg-slate-850 text-slate-500 border border-slate-750'
                          : isFull
                          ? 'badge-vacancy-full'
                          : slot.vacancies <= 5
                          ? 'badge-vacancy-low'
                          : 'badge-vacancy-high'
                      }`}
                    >
                      {isExpired
                        ? 'TIME FRAME COMPLETED'
                        : isFull
                        ? `FULL (${slot.capacity}/${slot.capacity})`
                        : `${slot.vacancies} / ${slot.capacity} Available (${slot.vacancies} ${slot.vacancies === 1 ? 'spot' : 'spots'} left)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                    <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                    <span>{slot.startTime} – {slot.endTime}</span>
                  </div>
                </div>

                <div>
                  {isUserBooked ? (
                    <span className="w-full py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Slot Reserved</span>
                    </span>
                  ) : isUserWaitlisted ? (
                    <span className="w-full py-2.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Waitlisted</span>
                    </span>
                  ) : isExpired ? (
                    <button
                      disabled
                      className="w-full py-2.5 bg-slate-900/90 text-slate-500 border border-slate-800 font-semibold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <span>Session Ended (Completed)</span>
                    </button>
                  ) : isFull ? (
                    slot.waitlistCount >= 5 ? (
                      <button
                        disabled
                        className="w-full py-2.5 bg-slate-800 text-slate-500 border border-slate-700 font-semibold text-xs rounded-xl cursor-not-allowed"
                      >
                        Slot & Waitlist Full (5/5)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBookSlot(slot.id)}
                        className="w-full py-2.5 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 font-semibold text-xs rounded-xl transition-all"
                      >
                        Join Waitlist ({slot.waitlistCount}/5 Filled)
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleBookSlot(slot.id)}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
                    >
                      Book Slot ({slot.vacancies} Spots Open)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
