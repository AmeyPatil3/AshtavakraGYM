'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  CalendarCheck,
  BarChart3,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  UserX,
  UserCheck,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Sliders,
  Save,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'slots' | 'analytics' | 'members' | 'export'>('attendance');
  const router = useRouter();

  // Admin Data State
  const [analyticsDate, setAnalyticsDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Attendance State
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attSlotId, setAttSlotId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [attMessage, setAttMessage] = useState<string | null>(null);

  // Slot Management State (Dynamic Capacity)
  const [slotDate, setSlotDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [managedSlots, setManagedSlots] = useState<any[]>([]);
  const [loadingManagedSlots, setLoadingManagedSlots] = useState(false);
  const [bulkCapacityInput, setBulkCapacityInput] = useState<string>('25');
  const [slotMessage, setSlotMessage] = useState<string | null>(null);

  // Members State
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('ALL');
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchAnalytics(analyticsDate);
    fetchAttendance(attDate, attSlotId);
    fetchManagedSlots(slotDate);
    fetchMembers();
  }, []);

  const fetchAnalytics = async (targetDate?: string) => {
    setLoadingAnalytics(true);
    try {
      const dateToFetch = targetDate || analyticsDate;
      const res = await fetch(`/api/admin/analytics?date=${dateToFetch}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchAttendance = async (date: string, slotId: string) => {
    setLoadingAtt(true);
    setAttMessage(null);
    try {
      const url = `/api/admin/attendance?date=${date}${slotId ? `&slotId=${slotId}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAtt(false);
    }
  };

  const fetchManagedSlots = async (date: string) => {
    setLoadingManagedSlots(true);
    setSlotMessage(null);
    try {
      const res = await fetch(`/api/admin/slots?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setManagedSlots(data.slots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingManagedSlots(false);
    }
  };



  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const url = `/api/admin/members?search=${encodeURIComponent(memberSearch)}&status=${memberStatusFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Update Single Slot Capacity
  const handleUpdateSlotCapacity = async (slotId: string, capacity: number) => {
    setSlotMessage(null);
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, capacity }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSlotMessage(data.error || 'Failed to update capacity');
        return;
      }

      setSlotMessage(data.message);
      fetchManagedSlots(slotDate);
      fetchAnalytics();
    } catch (err: any) {
      setSlotMessage(err.message || 'Error updating capacity');
    }
  };

  // Bulk Update Slot Capacity for Date
  const handleBulkUpdateCapacity = async () => {
    setSlotMessage(null);
    try {
      const res = await fetch('/api/admin/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: slotDate, capacity: parseInt(bulkCapacityInput, 10) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSlotMessage(data.error || 'Failed bulk capacity update');
        return;
      }

      setSlotMessage(data.message);
      fetchManagedSlots(slotDate);
      fetchAnalytics();
    } catch (err: any) {
      setSlotMessage(err.message || 'Error executing bulk capacity update');
    }
  };

  // Toggle single member attendance status with dynamic instant save
  const handleToggleAttendanceStatus = async (bookingId: string, newStatus: string) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) => (rec.bookingId === bookingId ? { ...rec, status: newStatus } : rec))
    );

    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ bookingId, status: newStatus }] }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAttMessage(data.error || 'Failed to save attendance');
        return;
      }

      setAttMessage(`Attendance updated to ${newStatus}.`);
      fetchAnalytics();
    } catch (err: any) {
      setAttMessage(err.message || 'Error saving attendance');
    }
  };

  // Bulk Action: "Mark All Attended" with dynamic instant save
  const handleMarkAllAttended = async () => {
    if (attendanceRecords.length === 0) return;

    const updates = attendanceRecords.map((r) => ({
      bookingId: r.bookingId,
      status: 'ATTENDED',
    }));

    setAttendanceRecords((prev) =>
      prev.map((rec) => ({ ...rec, status: 'ATTENDED' }))
    );

    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAttMessage(data.error || 'Failed to save attendance');
        return;
      }

      setAttMessage('Marked and saved all members as ATTENDED.');
      fetchAnalytics();
    } catch (err: any) {
      setAttMessage(err.message || 'Error saving attendance');
    }
  };

  // Toggle Member Account Status
  const handleToggleMemberStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: nextStatus }),
      });

      if (res.ok) {
        fetchMembers();
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Admin Control Center</h1>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
              Hostel Management
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic slot capacities, manage attendance, audit member accounts, and export reports.
          </p>
        </div>

        <button
          onClick={() => {
            fetchAnalytics();
            fetchAttendance(attDate, attSlotId);
            fetchManagedSlots(slotDate);
            fetchMembers();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh All Data</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'attendance'
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('slots')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'slots'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Dynamic Slot Capacity</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'analytics'
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Utilization</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'members'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Member Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'export'
            ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
            : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Reports</span>
        </button>
      </div>

      {/* TAB 1: ATTENDANCE MANAGEMENT MATRIX */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-emerald-400" />
                  Attendance Management
                </h2>
                <p className="text-xs text-slate-400">
                  Select a date to review booked members and mark attendance directly
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleMarkAllAttended}
                  disabled={attendanceRecords.length === 0}
                  className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>MARK ALL ATTENDED</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 w-fit">
              <span className="text-xs font-semibold text-slate-400">Target Date:</span>
              <input
                type="date"
                value={attDate}
                onChange={(e) => {
                  setAttDate(e.target.value);
                  fetchAttendance(e.target.value, attSlotId);
                }}
                style={{ colorScheme: 'dark' }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            {attMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{attMessage}</span>
              </div>
            )}

            {loadingAtt ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading attendance records...</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No member bookings recorded for date {attDate}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Member ID</th>
                      <th className="p-3">Member Name</th>
                      <th className="p-3">Gym Membership ID</th>
                      <th className="p-3">Slot Time</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3 text-right">Mark Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attendanceRecords.map((rec) => (
                      <tr key={rec.bookingId} className="hover:bg-slate-850/50">
                        <td className="p-3 font-mono font-semibold text-white">{rec.memberId}</td>
                        <td className="p-3 font-medium text-slate-200">{rec.name}</td>
                        <td className="p-3 font-mono text-blue-400 text-xs">{rec.gymMembershipId || 'N/A'}</td>
                        <td className="p-3 font-mono">{rec.slotTime} ({rec.slotPeriod})</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${rec.status === 'ATTENDED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : rec.status === 'NOT_ATTENDED'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : rec.status === 'EXCUSED'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              onClick={() => handleToggleAttendanceStatus(rec.bookingId, 'ATTENDED')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${rec.status === 'ATTENDED'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              Attended
                            </button>
                            <button
                              onClick={() => handleToggleAttendanceStatus(rec.bookingId, 'NOT_ATTENDED')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${rec.status === 'NOT_ATTENDED'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleToggleAttendanceStatus(rec.bookingId, 'EXCUSED')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${rec.status === 'EXCUSED'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                            >
                              Excused
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DYNAMIC SLOT CAPACITY MANAGER */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  Dynamic Slot Capacity Manager
                </h2>
                <p className="text-xs text-slate-400">
                  Decide and configure custom member capacities for individual slots
                </p>
              </div>

            </div>

            {slotMessage && (
              <div className="p-3 bg-blue-950/40 border border-blue-800/60 text-blue-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>{slotMessage}</span>
              </div>
            )}

            {/* Date Selector & Bulk Update Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Select Date:</span>
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => {
                    setSlotDate(e.target.value);
                    fetchManagedSlots(e.target.value);
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Set All Slots on {slotDate}:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCapacityInput}
                  onChange={(e) => setBulkCapacityInput(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-white focus:outline-none"
                />
                <button
                  onClick={handleBulkUpdateCapacity}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-bold rounded-lg shadow-md transition-all"
                >
                  Apply to All Slots
                </button>
              </div>
            </div>

            {/* Managed Slots Cards Grid */}
            {loadingManagedSlots ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading slots for {slotDate}...</div>
            ) : managedSlots.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No active slots generated for {slotDate}.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {managedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {slot.period} SESSION
                        </span>
                        <span className="text-xs font-bold text-blue-400">
                          {slot.bookedCount} / {slot.capacity} Booked
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-base font-bold text-white">
                        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{slot.startTime} – {slot.endTime}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <label className="block text-[11px] font-semibold text-slate-400">
                        Configured Slot Capacity (Students):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          defaultValue={slot.capacity}
                          id={`cap-input-${slot.id}`}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => {
                            const val = (document.getElementById(`cap-input-${slot.id}`) as HTMLInputElement)?.value;
                            if (val) handleUpdateSlotCapacity(slot.id, parseInt(val, 10));
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shrink-0"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS OVERVIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Daily Analytics & Utilization
              </h2>
              <p className="text-xs text-slate-400">
                Select any date from the calendar to review daily gym occupancy, slot utilization, attendance rates, and 7-day trend history.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
              <span className="text-xs font-semibold text-slate-400">Target Date:</span>
              <input
                type="date"
                value={analyticsDate}
                onChange={(e) => {
                  setAnalyticsDate(e.target.value);
                  fetchAnalytics(e.target.value);
                }}
                style={{ colorScheme: 'dark' }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
              />
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading analytics data for {analyticsDate}...</div>
          ) : !analytics ? (
            <div className="py-12 text-center text-slate-400 text-xs">Failed to load analytics metrics.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Members</span>
                  <p className="text-2xl font-bold text-white">{analytics.kpis?.totalMembers || 0}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bookings ({analyticsDate})</span>
                  <p className="text-2xl font-bold text-blue-400">{analytics.kpis?.dateTotalBookings ?? analytics.kpis?.todayTotalBookings ?? 0}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                  <p className="text-2xl font-bold text-emerald-400">{analytics.kpis?.attendanceRate ?? analytics.kpis?.overallAttendanceRate ?? 100}%</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Utilization Rate</span>
                  <p className="text-2xl font-bold text-purple-400">{analytics.kpis?.utilizationRate ?? analytics.kpis?.todayUtilizationRate ?? 0}%</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white">Slot Capacity & Utilization Breakdown ({analyticsDate})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Slot Time</th>
                        <th className="p-3">Period</th>
                        <th className="p-3">Dynamic Capacity</th>
                        <th className="p-3">Booked Members</th>
                        <th className="p-3">Remaining Vacancies</th>
                        <th className="p-3">Attended</th>
                        <th className="p-3">Utilization</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(analytics.slots || analytics.todaySlots || []).map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-850/50">
                          <td className="p-3 font-mono font-semibold text-white">{s.time}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                              {s.period}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-white">{s.capacity}</td>
                          <td className="p-3 font-bold text-blue-400">{s.booked}</td>
                          <td className="p-3 font-bold text-emerald-400">{s.vacancies}</td>
                          <td className="p-3 text-slate-300">{s.attended}</td>
                          <td className="p-3 font-bold text-purple-400">{s.utilization}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white">7-Day Booking & Attendance Trends</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.trendData}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      />
                      <Bar dataKey="bookings" fill="#3b82f6" name="Total Bookings" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="attended" fill="#10b981" name="Attended Sessions" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 4: MEMBER DIRECTORY */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Member Directory ({members.length})
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, email, ID..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
                    className="bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
                  />
                </div>

                <select
                  value={memberStatusFilter}
                  onChange={(e) => {
                    setMemberStatusFilter(e.target.value);
                    fetchMembers();
                  }}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Account Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="BLOCKED">Blocked</option>
                </select>

                <button
                  onClick={fetchMembers}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {loadingMembers ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading member list...</div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No registered members match your search criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Member ID</th>
                      <th className="p-3">Member Name</th>
                      <th className="p-3">Somaiya Email</th>
                      <th className="p-3">Gym Membership ID</th>
                      <th className="p-3">Blood Group</th>
                      <th className="p-3">Attendance %</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-850/50">
                        <td className="p-3 font-mono font-semibold text-white">{m.memberId}</td>
                        <td className="p-3 font-medium text-slate-200">{m.name}</td>
                        <td className="p-3 text-slate-300 font-mono text-[11px]">{m.email}</td>
                        <td className="p-3 font-mono text-blue-400 text-xs">{m.gymMembershipId || 'N/A'}</td>
                        <td className="p-3 text-slate-300">{m.bloodGroup}</td>
                        <td className="p-3 font-bold text-emerald-400">{m.attendanceRate}%</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleMemberStatus(m.id, m.status)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${m.status === 'ACTIVE'
                              ? 'bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-800/50'
                              : 'bg-emerald-950/40 hover:bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                              }`}
                          >
                            {m.status === 'ACTIVE' ? 'Block Member' : 'Activate Member'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/* TAB 6: CSV EXPORT REPORTS */}
      {activeTab === 'export' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-400" />
              Download System CSV Reports
            </h2>
            <p className="text-xs text-slate-400">Export complete database records for administration, audits, and hostel filing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Attendance Log Report</h3>
              <p className="text-xs text-slate-400">Includes date, slot time, member ID, name, attendance status, and marking timestamp.</p>
              <a
                href="/api/admin/export?type=attendance"
                download
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all block text-center"
              >
                <Download className="w-4 h-4" />
                <span>Export Attendance CSV</span>
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Registered Members CSV</h3>
              <p className="text-xs text-slate-400">Complete list of registered students, Member IDs, Somaiya emails, Gym Membership IDs, and status.</p>
              <a
                href="/api/admin/export?type=members"
                download
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all block text-center"
              >
                <Download className="w-4 h-4" />
                <span>Export Members CSV</span>
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Bookings History CSV</h3>
              <p className="text-xs text-slate-400">Detailed list of all confirmed, waitlisted, and cancelled slot reservations.</p>
              <a
                href="/api/admin/export?type=bookings"
                download
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all block text-center"
              >
                <Download className="w-4 h-4" />
                <span>Export Bookings CSV</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
