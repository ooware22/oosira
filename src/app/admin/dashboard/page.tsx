'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/Toggles';
import { useState, useEffect } from 'react';
import {
  UsersIcon, ChartBarIcon, ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  DocumentTextIcon, ArrowDownTrayIcon, SparklesIcon,
  Bars3Icon, CheckCircleIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';

type AdminView = 'overview' | 'users';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit modal
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const stored = localStorage.getItem('adminUser');
    if (!token || !stored) { router.push('/admin'); return; }
    setAdminUser(JSON.parse(stored));
    fetchStats(token);
    fetchUsers(token);
  }, [router]);

  const getToken = () => localStorage.getItem('adminToken') || '';

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/admin/stats/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async (token: string, q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchUsers(getToken(), val);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    router.push('/admin');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${editingUser.id}/`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editingUser.plan, isActive: editingUser.isActive, isStaff: editingUser.isStaff })
      });
      if (res.ok) { setEditingUser(null); fetchUsers(getToken(), search); fetchStats(getToken()); }
    } catch (e) { console.error(e); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      const res = await fetch(`http://localhost:8000/api/admin/users/${userId}/`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) { fetchUsers(getToken(), search); fetchStats(getToken()); }
      else { const d = await res.json(); alert(d.detail); }
    } catch (e) { console.error(e); }
  };

  if (!adminUser) return null;

  const navItems: { id: AdminView; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
  ];

  return (
    <div className="h-screen bg-bg text-txt font-body flex relative overflow-hidden selection:bg-txt selection:text-bg">

      {/* Mobile overlay — same as main dashboard */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ═══════════ SIDEBAR — matches main dashboard exactly ═══════════ */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] h-screen shrink-0 bg-surface/95 backdrop-blur-xl border-r border-border
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo — same infinity logo */}
        <div className="px-6 py-6 flex items-center justify-between">
          <Link href="/admin/dashboard" dir="ltr" className="flex flex-row items-end group select-none">
            <svg width="30" height="17" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] overflow-visible mb-0.5">
              <defs>
                <linearGradient id="infinityAdminDash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" fill="none" stroke="url(#infinityAdminDash)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[26px] font-display font-bold text-txt leading-none ml-1">sira</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Admin badge button — same style as "New CV" button */}
        <div className="px-4 mb-4">
          <div className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium text-[13px] overflow-hidden shadow-lg shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left z-0" />
            <ShieldCheckIcon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Admin Panel</span>
          </div>
        </div>

        {/* Nav links — same style as main dashboard */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15'
                    : 'text-txt-muted hover:text-txt hover:bg-surface2'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-500' : ''}`} />
                <span>{item.label}</span>
                {item.id === 'users' && (
                  <span className="ml-auto text-[10px] font-bold bg-surface2 text-txt-muted px-2 py-0.5 rounded-full">
                    {stats?.totalUsers ?? '…'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User row — same style as main dashboard */}
        <div className="px-4 pb-5 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-[13px] shrink-0">
              {adminUser.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-txt truncate">{adminUser.name}</p>
              <p className="text-[11px] text-txt-muted truncate">{adminUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-txt-muted hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar — same as main dashboard */}
        <div className="h-16 shrink-0 border-b border-border bg-surface/60 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-surface2 text-txt-muted">
              <Bars3Icon className="w-5 h-5" />
            </button>
            <h2 className="text-[15px] font-bold text-txt">
              {activeView === 'overview' ? 'Dashboard Overview' : 'User Management'}
            </h2>
          </div>
          <ThemeToggle />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ── */}
            {activeView === 'overview' && stats && (
              <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                {/* Stat cards — same card style as main dashboard */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: UsersIcon, color: 'from-blue-600 to-cyan-400', shadow: 'shadow-blue-500/20' },
                    { label: 'Pro Users', value: stats.proUsers, icon: SparklesIcon, color: 'from-purple-600 to-pink-400', shadow: 'shadow-purple-500/20' },
                    { label: 'Total CVs', value: stats.totalCvs, icon: DocumentTextIcon, color: 'from-emerald-600 to-teal-400', shadow: 'shadow-emerald-500/20' },
                    { label: 'Downloads', value: stats.totalDownloads, icon: ArrowDownTrayIcon, color: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20' },
                  ].map((s, i) => (
                    <div key={i} className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-5 hover:border-blue-500/20 transition-all duration-300 group">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">{s.label}</span>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg ${s.shadow}`}>
                          <s.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-txt">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Secondary stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                  <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-5">
                    <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">New (7 days)</span>
                    <p className="text-2xl font-extrabold text-txt mt-2">{stats.newUsers7d}</p>
                  </div>
                  <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-5">
                    <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">New (30 days)</span>
                    <p className="text-2xl font-extrabold text-txt mt-2">{stats.newUsers30d}</p>
                  </div>
                  <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-5">
                    <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">Staff Members</span>
                    <p className="text-2xl font-extrabold text-txt mt-2">{stats.staffUsers}</p>
                  </div>
                </div>

                {/* Weekly chart — same bar chart style as main dashboard */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-[13px] font-bold text-txt mb-5">Weekly Signups</h3>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {(stats.weeklySignups || []).map((d: any, i: number) => {
                      const max = Math.max(...(stats.weeklySignups || []).map((x: any) => x.value), 1);
                      const pct = (d.value / max) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-[10px] font-bold text-txt-muted">{d.value}</span>
                          <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-500" style={{ height: `${Math.max(pct, 4)}%` }} />
                          <span className="text-[10px] text-txt-dim">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── USERS ── */}
            {activeView === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                {/* Search — same style as main dashboard */}
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-dim" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full bg-surface2 border border-border rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-txt-dim"
                    />
                  </div>
                </div>

                {/* Users table */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-5 py-4 text-[10px] font-bold text-txt-muted uppercase tracking-wider">User</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-txt-muted uppercase tracking-wider">Plan</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-txt-muted uppercase tracking-wider">Status</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-txt-muted uppercase tracking-wider">CVs</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-txt-muted uppercase tracking-wider">Joined</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-txt-muted uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {loading ? (
                          <tr><td colSpan={6} className="px-5 py-12 text-center text-txt-dim text-sm">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                          <tr><td colSpan={6} className="px-5 py-12 text-center text-txt-dim text-sm">No users found.</td></tr>
                        ) : users.map(u => (
                          <tr key={u.id} className="hover:bg-surface2/40 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-[11px] shrink-0">
                                  {u.name?.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-txt truncate flex items-center gap-1.5">
                                    {u.name}
                                    {u.isStaff && <span className="text-[9px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">STAFF</span>}
                                  </p>
                                  <p className="text-[11px] text-txt-muted truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                u.plan === 'pro'
                                  ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-500 border border-blue-500/20'
                                  : 'bg-surface2 text-txt-muted'
                              }`}>
                                {u.plan}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                <span className={`text-[12px] font-medium ${u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                  {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] text-txt-muted">{u.cvCount}</td>
                            <td className="px-5 py-3.5 text-[12px] text-txt-muted">{new Date(u.joinedAt).toLocaleDateString()}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => setEditingUser({...u})} className="p-2 rounded-lg text-txt-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteUser(u.id)} disabled={u.isSuperuser} className="p-2 rounded-lg text-txt-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ═══════════ EDIT MODAL ═══════════ */}
      <AnimatePresence>
        {editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface/95 backdrop-blur-2xl border border-border rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h3 className="text-[15px] font-bold text-txt">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted"><XMarkIcon className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                {/* User info */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">{editingUser.name?.charAt(0)}</div>
                  <div><p className="font-semibold text-sm">{editingUser.name}</p><p className="text-[11px] text-txt-muted">{editingUser.email}</p></div>
                </div>

                {/* Plan */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">Plan</label>
                  <select
                    value={editingUser.plan}
                    onChange={e => setEditingUser({...editingUser, plan: e.target.value})}
                    className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-[13px] text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between bg-surface2 border border-border rounded-xl p-4">
                  <div><p className="text-[13px] font-medium text-txt">Active</p><p className="text-[11px] text-txt-muted">Can log in</p></div>
                  <button type="button" onClick={() => setEditingUser({...editingUser, isActive: !editingUser.isActive})}
                    className={`relative w-11 h-6 rounded-full transition-colors ${editingUser.isActive ? 'bg-blue-500' : 'bg-border'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${editingUser.isActive ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-surface2 border border-border rounded-xl p-4">
                  <div><p className="text-[13px] font-medium text-txt">Staff</p><p className="text-[11px] text-txt-muted">Admin panel access</p></div>
                  <button type="button" disabled={editingUser.isSuperuser} onClick={() => setEditingUser({...editingUser, isStaff: !editingUser.isStaff})}
                    className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 ${editingUser.isStaff ? 'bg-blue-500' : 'bg-border'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${editingUser.isStaff ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 bg-surface2 border border-border hover:bg-border/50 rounded-xl text-[13px] font-medium text-txt transition-colors">Cancel</button>
                  <button type="submit" className="group relative flex-1 py-3 rounded-xl text-white text-[13px] font-medium overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
                    <span className="relative z-10">Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
