'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Home, Heart, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-purple-950/40 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name || 'Member Profile'}</h1>
            <p className="text-xs text-slate-400">
              Member ID: <span className="text-slate-200 font-mono font-semibold">{user?.memberId}</span>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading profile details...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Details Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              Personal & Hostel Details
            </h2>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Somaiya ID Card No.
                </span>
                <span className="font-mono font-bold text-white">{user?.memberId}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Gym Membership ID
                </span>
                <span className="font-mono font-bold text-blue-400">{user?.gymMembershipId || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Address
                </span>
                <span className="font-mono font-medium text-white">{user?.email}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Phone Number
                </span>
                <span className="font-medium text-white">{user?.phone}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-slate-500" />
                  Blood Group
                </span>
                <span className="font-bold text-purple-400">{user?.bloodGroup}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Account Status
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {user?.status}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Registered Date
                </span>
                <span className="text-slate-300">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Rules & Policy Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Gym Rules & Guidelines
            </h2>

            <ul className="space-y-3 text-xs text-slate-300 pt-2">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Slot capacity is strictly fixed at <strong>25 members</strong> per operating session.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Maximum 1 booking per member per day allowed.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cancel at least 30 minutes in advance if you cannot attend.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Attendance is verified directly by the hostel gym administrator on duty.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Maintain cleanliness and return weights to racks after use.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
