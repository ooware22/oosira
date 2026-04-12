'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useAuth, DraftCV } from '@/app/auth/AuthContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  ShareIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  GlobeAltIcon,
  SwatchIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

type DashboardView = 'cvs' | 'settings' | 'profile' | 'analytics';

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; trend?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <ArrowTrendingUpIcon className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-txt tracking-tight">{value}</p>
      <p className="text-[12px] text-txt-muted mt-0.5">{label}</p>
    </motion.div>
  );
}

// ── CV Draft Card ──
function CVCard({ draft, onEdit, onDuplicate, onDelete, delay }: {
  draft: DraftCV; onEdit: () => void; onDuplicate: () => void; onDelete: () => void; delay: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusConfig = {
    draft: { icon: ClockIcon, label: 'Draft', cls: 'text-amber-500 bg-amber-500/10' },
    completed: { icon: CheckCircleIcon, label: 'Completed', cls: 'text-emerald-500 bg-emerald-500/10' },
    shared: { icon: ShareIcon, label: 'Shared', cls: 'text-blue-500 bg-blue-500/10' },
  };

  const status = statusConfig[draft.status];
  const StatusIcon = status.icon;

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-surface/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 hover:-translate-y-1"
    >
      {/* ── Preview Header ── */}
      <div
        className="h-32 relative overflow-hidden cursor-pointer"
        onClick={onEdit}
        style={{ background: draft.previewColor }}
      >
        {/* Mini CV Preview Lines */}
        <div className="absolute inset-0 p-4 opacity-60">
          <div className="w-16 h-1.5 bg-white/30 rounded-full mb-2" />
          <div className="w-24 h-1 bg-white/20 rounded-full mb-3" />
          <div className="flex gap-6">
            <div className="flex-1 space-y-1.5">
              <div className="w-full h-0.5 bg-white/15 rounded" />
              <div className="w-4/5 h-0.5 bg-white/15 rounded" />
              <div className="w-full h-0.5 bg-white/15 rounded" />
              <div className="w-3/5 h-0.5 bg-white/15 rounded" />
            </div>
            <div className="w-16 space-y-1.5">
              <div className="w-full h-0.5 bg-white/15 rounded" />
              <div className="w-3/4 h-0.5 bg-white/15 rounded" />
              <div className="w-full h-0.5 bg-white/15 rounded" />
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
          <span className="text-white text-[12px] font-medium flex items-center gap-1.5">
            <PencilSquareIcon className="w-3.5 h-3.5" /> Edit CV
          </span>
        </div>

        {/* Template badge */}
        <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-md text-[10px] text-white/90 font-medium">
          {draft.templateName}
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-txt truncate">{draft.title}</h3>
            <p className="text-[12px] text-txt-muted truncate">{draft.jobTitle}</p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 rounded-lg hover:bg-surface2 text-txt-muted hover:text-txt transition-colors"
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 rtl:right-auto rtl:left-0 top-8 w-40 bg-surface border border-border rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
                >
                  <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-txt hover:bg-surface2 transition">
                    <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => { onDuplicate(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-txt hover:bg-surface2 transition">
                    <DocumentDuplicateIcon className="w-3.5 h-3.5" /> Duplicate
                  </button>
                  <button onClick={() => { window.open('/builder', '_blank'); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-txt hover:bg-surface2 transition">
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" /> Open in new tab
                  </button>
                  <div className="border-t border-border my-1" />
                  <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-500 hover:bg-red-500/5 transition">
                    <TrashIcon className="w-3.5 h-3.5" /> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-txt-dim font-medium uppercase tracking-wider">Completion</span>
            <span className="text-[10px] font-bold text-txt-muted">{draft.completionPercent}%</span>
          </div>
          <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${draft.completionPercent}%` }}
              transition={{ duration: 1, delay: delay * 0.08 + 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${draft.completionPercent === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
            <StatusIcon className="w-3 h-3" /> {status.label}
          </span>
          <span className="text-[10px] text-txt-dim flex items-center gap-1">
            <ClockIcon className="w-3 h-3" /> {timeAgo(draft.lastEdited)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════════
// ██████  MAIN DASHBOARD  ██████
// ════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { t, dir } = useLanguage();
  const { user, isAuthenticated, logout, drafts, deleteDraft, duplicateDraft } = useAuth();
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>('cvs');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const filteredDrafts = drafts.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.templateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = drafts.filter((d) => d.status === 'completed').length;
  const draftCount = drafts.filter((d) => d.status === 'draft').length;

  // ── Sidebar Nav Items ──
  const navItems: { id: DashboardView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cvs', label: 'My CVs', icon: DocumentTextIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  ];

  return (
    <div className="h-screen bg-bg text-txt font-body flex relative overflow-hidden selection:bg-txt selection:text-bg">

      {/* ═══════════ SIDEBAR ═══════════ */}
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:static inset-y-0 left-0 rtl:left-auto rtl:right-0 z-50
        w-[260px] h-screen shrink-0 bg-surface/95 backdrop-blur-xl border-r rtl:border-r-0 rtl:border-l border-border
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-6 py-6 flex items-center justify-between">
          <Link href="/" dir="ltr" className="flex flex-row items-end group select-none">
            <svg width="30" height="17" viewBox="1 6 22 12" className="text-blue-600 dark:text-blue-500 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] overflow-visible mb-0.5">
              <defs>
                <linearGradient id="infinityDash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" fill="none" stroke="url(#infinityDash)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[26px] font-display font-bold text-txt leading-none ml-1">sira</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-surface2 text-txt-muted">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Create New CV Button */}
        <div className="px-4 mb-4">
          <Link
            href="/builder"
            className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium text-[13px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 hover:shadow-cyan-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 dark:from-blue-500 dark:via-cyan-300 dark:to-blue-500 bg-[length:200%_auto] bg-left group-hover:bg-right transition-all duration-700 z-0" />
            <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-all duration-700 z-0" />
            <PlusIcon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">New CV</span>
          </Link>
        </div>

        {/* Nav links */}
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
                {item.label}
                {item.id === 'cvs' && (
                  <span className="ml-auto text-[10px] font-bold bg-surface2 text-txt-muted px-2 py-0.5 rounded-full">
                    {drafts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Plan Badge & User */}
        <div className="px-4 pb-5 space-y-3">
          {/* Pro badge */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/15 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <SparklesIcon className="w-4 h-4 text-blue-500" />
              <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pro Plan</span>
            </div>
            <p className="text-[11px] text-txt-muted leading-relaxed">Unlimited CVs, all templates, PDF export</p>
          </div>

          {/* User row */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-[13px] shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-txt truncate">{user.name}</p>
              <p className="text-[11px] text-txt-muted truncate">{user.email}</p>
            </div>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-txt-muted hover:text-red-500 transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* ── Top Bar ── */}
        <header className="shrink-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-surface2 text-txt-muted"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-[18px] sm:text-[20px] font-bold text-txt">
                {activeView === 'cvs' && 'My CVs'}
                {activeView === 'analytics' && 'Analytics'}
                {activeView === 'settings' && 'Settings'}
                {activeView === 'profile' && 'Profile'}
              </h1>
              <p className="text-[12px] text-txt-muted hidden sm:block">
                {activeView === 'cvs' && `${drafts.length} CVs · ${completedCount} completed`}
                {activeView === 'analytics' && 'Track your CV performance'}
                {activeView === 'settings' && 'Manage your preferences'}
                {activeView === 'profile' && 'Your personal information'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search (only on CVs view) */}
            {activeView === 'cvs' && (
              <div className="relative hidden sm:block">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-txt-dim" />
                <input
                  type="text"
                  placeholder="Search CVs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 bg-surface2 border border-transparent focus:border-blue-500/40 rounded-xl pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2 text-[12px] text-txt outline-none transition-all focus:w-64 focus:ring-2 focus:ring-blue-500/10 placeholder:text-txt-dim"
                />
              </div>
            )}

            <button className="relative p-2 rounded-xl hover:bg-surface2 text-txt-muted transition-colors">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-bg" />
            </button>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <AnimatePresence mode="wait">

            {/* ═════════ CVs VIEW ═════════ */}
            {activeView === 'cvs' && (
              <motion.div
                key="cvs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <StatCard icon={DocumentTextIcon} label="Total CVs" value={String(drafts.length)} trend="+2" color="bg-gradient-to-br from-blue-600 to-blue-500" />
                  <StatCard icon={CheckCircleIcon} label="Completed" value={String(completedCount)} color="bg-gradient-to-br from-emerald-600 to-emerald-500" />
                  <StatCard icon={ClockIcon} label="In Progress" value={String(draftCount)} color="bg-gradient-to-br from-amber-600 to-amber-500" />
                  <StatCard icon={ArrowDownTrayIcon} label="Downloads" value="24" trend="+8" color="bg-gradient-to-br from-purple-600 to-purple-500" />
                </div>

                {/* CV Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {/* Create New Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0, duration: 0.4 }}
                  >
                    <Link
                      href="/builder"
                      className="group flex flex-col items-center justify-center h-full min-h-[240px] bg-surface/50 border-2 border-dashed border-border hover:border-blue-500/40 rounded-2xl transition-all duration-500 hover:bg-blue-500/5 hover:shadow-xl hover:shadow-blue-500/5"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <PlusIcon className="w-7 h-7 text-blue-500" />
                      </div>
                      <span className="text-[14px] font-semibold text-txt-muted group-hover:text-blue-500 transition-colors">Create New CV</span>
                      <span className="text-[11px] text-txt-dim mt-1">Start from scratch or use a template</span>
                    </Link>
                  </motion.div>

                  {filteredDrafts.map((draft, i) => (
                    <CVCard
                      key={draft.id}
                      draft={draft}
                      delay={i + 1}
                      onEdit={() => router.push('/builder')}
                      onDuplicate={() => duplicateDraft(draft.id)}
                      onDelete={() => setDeleteConfirm(draft.id)}
                    />
                  ))}
                </div>

                {filteredDrafts.length === 0 && searchQuery && (
                  <div className="text-center py-20">
                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-txt-dim mb-3" />
                    <p className="text-txt-muted font-medium">No CVs found matching &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═════════ ANALYTICS VIEW ═════════ */}
            {activeView === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={EyeIcon} label="Total Views" value="1,247" trend="+18%" color="bg-gradient-to-br from-blue-600 to-blue-500" />
                  <StatCard icon={ArrowDownTrayIcon} label="Total Downloads" value="24" trend="+33%" color="bg-gradient-to-br from-emerald-600 to-emerald-500" />
                  <StatCard icon={ShareIcon} label="Shared Links" value="8" trend="+5" color="bg-gradient-to-br from-purple-600 to-purple-500" />
                  <StatCard icon={ArrowTrendingUpIcon} label="Profile Score" value="92/100" color="bg-gradient-to-br from-amber-600 to-amber-500" />
                </div>

                {/* Charts mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Activity Card */}
                  <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                    <h3 className="text-[15px] font-bold text-txt mb-4">Weekly Activity</h3>
                    <div className="flex items-end gap-2 h-40">
                      {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-lg relative group cursor-pointer hover:from-blue-500 hover:to-cyan-300 transition-all"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-txt opacity-0 group-hover:opacity-100 transition bg-surface px-1.5 py-0.5 rounded shadow">
                            {h}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] text-txt-dim font-medium">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Template Popularity */}
                  <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                    <h3 className="text-[15px] font-bold text-txt mb-4">Template Usage</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Tech & IT', pct: 38, color: 'from-blue-600 to-blue-400' },
                        { name: 'Cadre Moderne', pct: 27, color: 'from-purple-600 to-purple-400' },
                        { name: 'Classique Pro', pct: 20, color: 'from-emerald-600 to-emerald-400' },
                        { name: 'Ingenieur', pct: 10, color: 'from-amber-600 to-amber-400' },
                        { name: 'Medical', pct: 5, color: 'from-red-600 to-red-400' },
                      ].map((t, i) => (
                        <div key={t.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12px] font-medium text-txt">{t.name}</span>
                            <span className="text-[11px] font-bold text-txt-muted">{t.pct}%</span>
                          </div>
                          <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${t.pct}%` }}
                              transition={{ delay: i * 0.1 + 0.4, duration: 0.8 }}
                              className={`h-full rounded-full bg-gradient-to-r ${t.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-[15px] font-bold text-txt mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {[
                      { action: 'Downloaded', cv: 'Software Engineer CV', time: '2 hours ago', icon: ArrowDownTrayIcon, color: 'text-blue-500 bg-blue-500/10' },
                      { action: 'Edited', cv: 'Senior Engineer Application', time: '1 day ago', icon: PencilSquareIcon, color: 'text-amber-500 bg-amber-500/10' },
                      { action: 'Created', cv: 'Freelance Portfolio', time: '4 days ago', icon: PlusIcon, color: 'text-emerald-500 bg-emerald-500/10' },
                      { action: 'Shared', cv: 'Medical Application', time: '1 week ago', icon: ShareIcon, color: 'text-purple-500 bg-purple-500/10' },
                      { action: 'Completed', cv: 'Academic Resume', time: '1 week ago', icon: CheckCircleIcon, color: 'text-emerald-500 bg-emerald-500/10' },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 + 0.2 }}
                          className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                        >
                          <div className={`p-2 rounded-lg ${item.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-txt">
                              <span className="font-semibold">{item.action}</span> <span className="text-txt-muted">{item.cv}</span>
                            </p>
                          </div>
                          <span className="text-[10px] text-txt-dim shrink-0">{item.time}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═════════ SETTINGS VIEW ═════════ */}
            {activeView === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl space-y-6"
              >
                {/* Appearance */}
                <SettingsSection
                  icon={SwatchIcon}
                  title="Appearance"
                  description="Customize how Sira looks on your device"
                >
                  <SettingsRow label="Theme" description="Choose between light and dark mode">
                    <ThemeToggle />
                  </SettingsRow>
                  <SettingsRow label="Language" description="Set your preferred language">
                    <LanguageToggle />
                  </SettingsRow>
                  <SettingsRow label="CV Preview Scale" description="Default zoom level for CV previews">
                    <select className="bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500 transition min-w-[120px]">
                      <option>75%</option>
                      <option selected>100%</option>
                      <option>125%</option>
                      <option>150%</option>
                    </select>
                  </SettingsRow>
                </SettingsSection>

                {/* Privacy */}
                <SettingsSection
                  icon={ShieldCheckIcon}
                  title="Privacy & Security"
                  description="Control your data and account security"
                >
                  <SettingsRow label="Two-Factor Authentication" description="Add an extra layer of security">
                    <ToggleSwitch defaultChecked={false} />
                  </SettingsRow>
                  <SettingsRow label="Share Analytics" description="Help us improve by sharing anonymous usage data">
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                  <SettingsRow label="Auto-save Drafts" description="Automatically save changes as you type">
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection
                  icon={BellIcon}
                  title="Notifications"
                  description="Manage your notification preferences"
                >
                  <SettingsRow label="Email Notifications" description="Receive updates about your account">
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                  <SettingsRow label="New Template Alerts" description="Be notified when new templates are available">
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                  <SettingsRow label="Tips & Tutorials" description="Receive helpful CVs tips and guides">
                    <ToggleSwitch defaultChecked={false} />
                  </SettingsRow>
                </SettingsSection>

                {/* Export & Data */}
                <SettingsSection
                  icon={ArrowDownTrayIcon}
                  title="Data & Export"
                  description="Manage your data and export options"
                >
                  <SettingsRow label="Default PDF Size" description="Choose default paper size for exports">
                    <select className="bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500 transition min-w-[120px]">
                      <option selected>A4</option>
                      <option>Letter</option>
                      <option>Legal</option>
                    </select>
                  </SettingsRow>
                  <SettingsRow label="Export all CVs" description="Download all your CVs as a ZIP archive">
                    <button className="px-4 py-2 bg-surface2 border border-border rounded-xl text-[12px] font-medium text-txt hover:border-blue-500/40 transition-colors">
                      Export
                    </button>
                  </SettingsRow>
                </SettingsSection>

                {/* Danger Zone */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                  <h3 className="text-[15px] font-bold text-red-500 mb-1">Danger Zone</h3>
                  <p className="text-[12px] text-txt-muted mb-4">Irreversible actions for your account</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2.5 bg-surface border border-red-500/20 rounded-xl text-[12px] font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                      Delete All CVs
                    </button>
                    <button className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-[12px] font-medium hover:bg-red-600 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═════════ PROFILE VIEW ═════════ */}
            {activeView === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl space-y-6"
              >
                {/* Profile Header */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
                  {/* Banner */}
                  <div className="h-28 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
                  </div>

                  {/* Avatar & Info */}
                  <div className="px-6 pb-6 relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-[28px] border-4 border-surface -mt-10 shadow-xl">
                      {user.name.charAt(0)}
                    </div>
                    <div className="mt-3">
                      <h2 className="text-xl font-bold text-txt">{user.name}</h2>
                      <p className="text-[13px] text-txt-muted">{user.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                          <SparklesIcon className="w-3 h-3" /> Pro Plan
                        </span>
                        <span className="text-[11px] text-txt-dim">Member since Nov 2025</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Info Form */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-[15px] font-bold text-txt mb-5 flex items-center gap-2">
                    <UserCircleIcon className="w-5 h-5 text-blue-500" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="First Name" value="Islem" />
                    <FormField label="Last Name" value="Charaf Eddine" />
                    <FormField label="Email Address" value="islem@oosira.com" type="email" />
                    <FormField label="Phone" value="+213 555 00 00 00" />
                    <FormField label="Location" value="Algeria" />
                    <FormField label="LinkedIn" value="linkedin.com/in/islem" />
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-[13px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 z-0" />
                      <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-all duration-700 z-0" />
                      <span className="relative z-10">Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* Password Change */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-[15px] font-bold text-txt mb-5 flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-blue-500" /> Change Password
                  </h3>
                  <div className="space-y-4 max-w-sm">
                    <FormField label="Current Password" value="" type="password" placeholder="••••••••" />
                    <FormField label="New Password" value="" type="password" placeholder="••••••••" />
                    <FormField label="Confirm New Password" value="" type="password" placeholder="••••••••" />
                  </div>
                  <div className="mt-5">
                    <button className="px-5 py-2.5 bg-surface2 border border-border rounded-xl text-[13px] font-medium text-txt hover:border-blue-500/40 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ═══════════ DELETE CONFIRMATION MODAL ═══════════ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <TrashIcon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-[16px] font-bold text-txt mb-1">Delete CV?</h3>
              <p className="text-[13px] text-txt-muted mb-5">
                This action cannot be undone. The CV will be permanently removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-[13px] font-medium text-txt hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { deleteDraft(deleteConfirm); setDeleteConfirm(null); }}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-medium hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// REUSABLE SUB-COMPONENTS
// ════════════════════════════════════════════════════════════

function SettingsSection({ icon: Icon, title, description, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
    >
      <div className="px-6 pt-5 pb-3 border-b border-border/50">
        <h3 className="text-[15px] font-bold text-txt flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-500" /> {title}
        </h3>
        <p className="text-[12px] text-txt-muted mt-0.5">{description}</p>
      </div>
      <div className="divide-y divide-border/50">
        {children}
      </div>
    </motion.div>
  );
}

function SettingsRow({ label, description, children }: {
  label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <div>
        <p className="text-[13px] font-medium text-txt">{label}</p>
        <p className="text-[11px] text-txt-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ defaultChecked }: { defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-surface2 border border-border'}`}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${checked ? 'bg-white' : 'bg-txt-dim'}`}
      />
    </button>
  );
}

function FormField({ label, value, type = 'text', placeholder }: {
  label: string; value: string; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-[13px] text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-txt-dim"
      />
    </div>
  );
}
