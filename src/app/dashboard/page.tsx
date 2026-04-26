'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/api/apiClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { useAuth, DraftCV } from '@/app/auth/AuthContext';
import { ThemeToggle, LanguageToggle } from '@/components/Toggles';
import { Suspense, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchDashboardStats } from '@/store/slices/statsSlice';
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
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { useSubscription } from '@/app/hooks/useSubscription';

// ════════════════════════════════════════════════════════════
// NEW FORMS FOR PROFILE AND PASSWORD
// ════════════════════════════════════════════════════════════

function ProfileSettingsForm({ user, refreshUser }: { user: any, refreshUser: () => void }) {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(user.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [location, setLocation] = useState(user.location || '');
  const [linkedin, setLinkedin] = useState(user.linkedin || '');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorText('');
    try {
      await apiFetch('/users/profile/', {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, phone, location, linkedin })
      });
      setStatus('success');
      refreshUser();
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorText(err.message || 'Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-txt flex items-center gap-2">
          <UserCircleIcon className="w-5 h-5 text-blue-500" /> {t('dashboard.personalInformation') || "Personal Information"}
        </h3>
        {status === 'success' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">Saved!</span>}
        {status === 'error' && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full">{errorText}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('dashboard.firstName') || "First Name"} value={firstName} onChange={setFirstName} />
        <FormField label={t('dashboard.lastName') || "Last Name"} value={lastName} onChange={setLastName} />
        <div className="space-y-1.5 opacity-50 cursor-not-allowed">
           <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{t('dashboard.emailAddress') || "Email Address"}</label>
           <input type="email" readOnly value={user.email} className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-[13px] text-txt outline-none" />
        </div>
        <FormField label={t('dashboard.phoneLabel') || "Phone"} value={phone} onChange={setPhone} />
        <FormField label={t('dashboard.locationLabel') || "Location"} value={location} onChange={setLocation} />
        <FormField label={t('dashboard.linkedinLabel') || "LinkedIn"} value={linkedin} onChange={setLinkedin} />
      </div>
      <div className="mt-5 flex justify-end">
        <button disabled={status === 'loading'} type="submit" className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-[13px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 overflow-hidden disabled:opacity-70 disabled:pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 z-0" />
          <div className="absolute top-0 -left-[150%] group-hover:left-[150%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transition-all duration-700 z-0" />
          <span className="relative z-10">{status === 'loading' ? 'Saving...' : (t('dashboard.saveChanges') || "Save Changes")}</span>
        </button>
      </div>
    </form>
  );
}

function PasswordChangeForm() {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setErrorText('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setStatus('error');
      setErrorText('Password must be at least 8 characters');
      return;
    }

    setStatus('loading');
    setErrorText('');
    try {
      await apiFetch('/users/password/', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorText(err.message || 'Failed to update password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-txt flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-blue-500" /> {t('dashboard.changePassword') || "Change Password"}
        </h3>
        {status === 'success' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">Updated!</span>}
        {status === 'error' && <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full">{errorText}</span>}
      </div>
      <div className="space-y-4 max-w-sm">
        <FormField label={t('dashboard.currentPassword') || "Current Password"} value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="••••••••" />
        <FormField label={t('dashboard.newPassword') || "New Password"} value={newPassword} onChange={setNewPassword} type="password" placeholder="••••••••" />
        <FormField label={t('dashboard.confirmNewPassword') || "Confirm New Password"} value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="••••••••" />
      </div>
      <div className="mt-5">
        <button disabled={status === 'loading'} type="submit" className="px-5 py-2.5 bg-surface2 border border-border rounded-xl text-[13px] font-medium text-txt hover:border-blue-500/40 transition-colors disabled:opacity-50">
          {status === 'loading' ? 'Updating...' : (t('dashboard.updatePassword') || "Update Password")}
        </button>
      </div>
    </form>
  );
}

type DashboardView = 'cvs' | 'settings' | 'profile' | 'analytics' | 'pricing';

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
  const { t } = useLanguage();

  const statusConfig = {
    draft: { icon: ClockIcon, label: t('dashboard.draft') || 'Draft', cls: 'text-amber-500 bg-amber-500/10' },
    completed: { icon: CheckCircleIcon, label: t('dashboard.completed') || 'Completed', cls: 'text-emerald-500 bg-emerald-500/10' },
    shared: { icon: ShareIcon, label: t('dashboard.shared') || 'Shared', cls: 'text-blue-500 bg-blue-500/10' },
  };

  const status = statusConfig[draft.status];
  const StatusIcon = status.icon;

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return t('dashboard.justNow') || 'Just now';
    if (diffH < 24) return `${diffH} ${t('dashboard.hAgo') || 'h ago'}`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} ${t('dashboard.dAgo') || 'd ago'}`;
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

        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); window.open('/builder?id=' + draft.id + '&step=7', '_blank'); }}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-110"
            title={t('dashboard.view') || 'Voir'}
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-8 h-8 rounded-full bg-blue-500/80 hover:bg-blue-500 flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-110 shadow-lg shadow-blue-500/30"
            title={t('dashboard.edit') || 'Modifier'}
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              navigator.clipboard.writeText(window.location.origin + '/builder?id=' + draft.id);
              alert(t('dashboard.linkCopied') || 'Lien copié!'); 
            }}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-110"
            title={t('dashboard.share') || 'Partager'}
          >
            <ShareIcon className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white backdrop-blur-md transition-all hover:scale-110 shadow-lg shadow-red-500/30"
            title={t('dashboard.delete') || 'Supprimer'}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
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
                    <PencilSquareIcon className="w-3.5 h-3.5" /> {t('dashboard.edit') || 'Edit'}
                  </button>
                  <button onClick={() => { onDuplicate(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-txt hover:bg-surface2 transition">
                    <DocumentDuplicateIcon className="w-3.5 h-3.5" /> {t('dashboard.duplicate') || 'Duplicate'}
                  </button>
                  <button onClick={() => { window.open('/builder?id=' + draft.id, '_blank'); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-txt hover:bg-surface2 transition">
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" /> {t('dashboard.openNewTab') || 'Open in new tab'}
                  </button>
                  <div className="border-t border-border my-1" />
                  <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-500 hover:bg-red-500/5 transition">
                    <TrashIcon className="w-3.5 h-3.5" /> {t('dashboard.delete') || 'Delete'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-txt-dim font-medium uppercase tracking-wider">{t('dashboard.completion') || 'Completion'}</span>
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


// ── Pricing View ──
function PricingView({ subscription }: { subscription: ReturnType<typeof useSubscription> }) {
  const { t, language } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const currentPlan = subscription.subscription?.effectivePlan || 'free';

  const handleUpgrade = async () => {
    if (currentPlan === 'pro' || isCheckingOut) return;
    setIsCheckingOut(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${API_BASE}/subscriptions/checkout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('oosira_token')}`,
        },
        body: JSON.stringify({
          billing_cycle: isAnnual ? 'yearly' : 'monthly',
          locale: language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en',
        }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.detail || 'Failed to create checkout');
      }
    } catch (err: any) {
      alert(err.message || 'Payment service error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <motion.div
      key="pricing"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-txt mb-4 tracking-tight">
          {t('pricing.title1') || "Simple, transparent"} <span className="text-blue-600 dark:text-blue-400">{t('pricing.title2') || "pricing"}</span>
        </h2>
        <p className="text-lg text-txt-muted">
          {t('pricing.subtitle') || "Choose the perfect plan for your career growth. No hidden fees."}
        </p>

        <div className="mt-10 flex justify-center items-center gap-4">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-txt' : 'text-txt-dim'}`}>{t('pricing.monthly') || "Monthly"}</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-8 w-16 items-center rounded-full bg-blue-600 transition-colors focus:outline-none"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-9 rtl:-translate-x-9' : 'translate-x-1 rtl:-translate-x-1'}`}
            />
          </button>
          <span className={`text-sm font-medium ${isAnnual ? 'text-txt' : 'text-txt-dim'}`}>
            {t('pricing.annually') || "Annually"} <span className="ml-1.5 rtl:mr-1.5 rtl:ml-0 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('pricing.save20') || "Save 20%"}</span>
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Basic Plan */}
        <div className="rounded-3xl border border-border bg-surface p-8 shadow-sm hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-txt flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-txt-muted" />
              {t('pricing.basic') || "Basic"}
            </h3>
            <p className="text-txt-muted mt-2 text-sm">{t('pricing.basicDesc') || "Perfect for starting your job hunt."}</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-txt">{t('pricing.free') || "Free"}</span>
            </div>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-txt">{t('pricing.buildCVs') || "Build professional CVs"}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-txt">{t('pricing.pdfLimit') || "5 PDF downloads per month"}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-txt">{t('pricing.standardTemplates') || "Access to standard templates"}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-txt">{t('pricing.noOcr') || "1 free trial OCR"}</span>
            </li>
            <li className="flex items-start gap-3 opacity-60">
              <XMarkIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span className="text-txt-muted">{t('pricing.limitedColors') || "Limited color palettes"}</span>
            </li>
          </ul>

          <button className={`w-full py-3.5 rounded-xl font-bold ${currentPlan === 'free' ? 'text-txt-muted bg-surface2 border border-border cursor-default' : 'text-white bg-emerald-500'}`}>
            {currentPlan === 'free' ? (t('pricing.currentPlan') || "Current Plan") : (t('pricing.basic') || "Basic")}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="rounded-3xl border-2 border-blue-500 bg-surface p-8 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto bg-blue-500 text-white px-4 py-1 rounded-bl-xl rtl:rounded-br-xl rtl:rounded-bl-none font-bold text-sm tracking-wider uppercase">
            {t('pricing.mostPopular') || "Most Popular"}
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-txt flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-500" />
              {t('pricing.pro') || "Pro"}
            </h3>
            <p className="text-txt-muted mt-2 text-sm">{t('pricing.proDesc') || "Everything you need to stand out."}</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-txt">{isAnnual ? '400 DA' : '500 DA'}</span>
              <span className="text-txt-muted font-medium">{t('pricing.month') || "/ month"}</span>
            </div>
            {isAnnual && <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">{t('pricing.billedYearly') || "Billed 4800 DA yearly"}</p>}
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-txt font-medium">{t('pricing.unlimitedPdf') || "Unlimited PDF downloads"}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-txt font-medium">{t('pricing.aiOcr') || "AI-powered OCR Resume Import"}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-txt">{t('pricing.premiumTemplates') || "All premium templates unlocked"}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-txt">{t('pricing.advancedColors') || "Advanced color palettes & customization"}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span className="text-txt">{t('pricing.prioritySupport') || "Priority support"}</span>
            </li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={currentPlan === 'pro' || isCheckingOut}
            className={`w-full py-4 rounded-xl font-bold transition-all active:scale-[0.98] ${currentPlan === 'pro' ? 'text-white bg-emerald-500 cursor-default' : 'text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30'} disabled:opacity-70`}
          >
            {isCheckingOut ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('pricing.processing') || "Processing..."}
              </span>
            ) : currentPlan === 'pro' ? (t('pricing.currentPlan') || "Current Plan") : (t('pricing.upgradePro') || "Upgrade to Pro")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════════
// ██████  MAIN DASHBOARD CONTENT  ██████
// ════════════════════════════════════════════════════════════
function DashboardContent() {
  const { t, dir } = useLanguage();
  const { user, isAuthenticated, isHydrating, logout, drafts, deleteDraft, duplicateDraft, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = (searchParams?.get('view') as DashboardView) || 'cvs';
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const stats = useSelector((state: RootState) => state.stats);
  const sub = useSubscription();

  useEffect(() => {
    if (isAuthenticated && stats.status === 'idle') {
      dispatch(fetchDashboardStats());
    }
  }, [isAuthenticated, stats.status, dispatch]);

  // Auto-verify payment when returning from Chargily
  useEffect(() => {
    const paymentStatus = searchParams?.get('payment');
    if (paymentStatus === 'success' && isAuthenticated) {
      const verifyPayment = async () => {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const res = await fetch(`${API_BASE}/subscriptions/verify/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('oosira_token')}`,
            },
            body: JSON.stringify({}),
          });
          const data = await res.json();
          if (data.status === 'paid') {
            // Refresh subscription status to show Pro badge
            sub.refresh();
            // Clean URL
            router.replace('/dashboard?view=pricing');
          }
        } catch (err) {
          console.error('Payment verification failed:', err);
        }
      };
      verifyPayment();
    }
  }, [searchParams, isAuthenticated]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isHydrating) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrating, router]);

  if (isHydrating) return null; // Show nothing or a loading spinner
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
    { id: 'cvs', label: t('dashboard.tabCVs') || 'My CVs', icon: DocumentTextIcon },
    { id: 'analytics', label: t('dashboard.tabAnalytics') || 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: t('dashboard.tabSettings') || 'Settings', icon: Cog6ToothIcon },
    { id: 'profile', label: t('dashboard.tabProfile') || 'Profile', icon: UserCircleIcon },
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
          <Link href="/dashboard" dir="ltr" className="flex flex-row items-end group select-none">
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
            <span className="relative z-10">{t('dashboard.newCV') || 'New CV'}</span>
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
                <span>{item.label}</span>
                {item.id === 'cvs' && (
                  <span className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} text-[10px] font-bold bg-surface2 text-txt-muted px-2 py-0.5 rounded-full`}>
                    {drafts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Plan Badge & User */}
        <div className="px-4 pb-5 space-y-3">
          {/* Plan badge */}
          <button onClick={() => { setActiveView('pricing'); setSidebarOpen(false); }} className="w-full text-left block bg-surface2 border border-border rounded-xl p-3.5 hover:border-blue-500/40 transition-colors group">
            <div className="flex items-center gap-2 mb-1.5">
              {sub.isPro ? (
                <SparklesIcon className="w-4 h-4 text-blue-500 transition-colors" />
              ) : (
                <DocumentTextIcon className="w-4 h-4 text-txt-muted group-hover:text-blue-500 transition-colors" />
              )}
              <span className={`text-[12px] font-bold uppercase tracking-wider transition-colors ${
                sub.isPro ? 'text-blue-500' : 'text-txt-muted group-hover:text-blue-500'
              }`}>{sub.isPro ? (t('dashboard.proPlan') || 'Pro Plan') : (t('dashboard.basicPlan') || 'Basic Plan')}</span>
            </div>
            {sub.isPro ? (
              <p className="text-[11px] text-txt-muted leading-relaxed">{t('pricing.unlimitedPdf') || 'Unlimited downloads'}</p>
            ) : (
              <>
                <p className="text-[11px] text-txt-muted leading-relaxed">
                  {sub.subscription ? `${sub.subscription.pdfDownloadsRemaining}/${sub.subscription.pdfDownloadLimit}` : '5/5'}
                  {' '}{t('dashboard.statDownloads') || 'downloads left'}
                </p>
                <div className="mt-1.5 h-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${sub.subscription ? ((sub.subscription.pdfDownloadsRemaining / sub.subscription.pdfDownloadLimit) * 100) : 100}%` }}
                  />
                </div>
              </>
            )}
          </button>

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
                {activeView === 'cvs' && (t('dashboard.tabCVs') || 'My CVs')}
                {activeView === 'analytics' && (t('dashboard.tabAnalytics') || 'Analytics')}
                {activeView === 'settings' && (t('dashboard.tabSettings') || 'Settings')}
                {activeView === 'profile' && (t('dashboard.tabProfile') || 'Profile')}
                {activeView === 'pricing' && (t('nav.pricing') || 'Pricing')}
              </h1>
              <p className="text-[12px] text-txt-muted hidden sm:block">
                {activeView === 'cvs' && `${drafts.length} CVs · ${completedCount} ${t('dashboard.completed') || 'completed'}`}
                {activeView === 'analytics' && (t('dashboard.analyticsDesc') || 'Track your CV performance')}
                {activeView === 'settings' && (t('dashboard.settingsDesc') || 'Manage your preferences')}
                {activeView === 'profile' && (t('dashboard.profileDesc') || 'Your personal information')}
                {activeView === 'pricing' && (t('pricing.subtitle') || 'Upgrade your plan to unlock premium features')}
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
                  placeholder={t('dashboard.searchPlaceholder') || "Search CVs..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 lg:w-[400px] bg-surface2 border border-transparent focus:border-blue-500/40 rounded-xl pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2 text-[12px] text-txt outline-none transition-all focus:w-96 lg:focus:w-[480px] focus:ring-2 focus:ring-blue-500/10 placeholder:text-txt-dim"
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

            {/* ═════════ PRICING VIEW ═════════ */}
            {activeView === 'pricing' && <PricingView subscription={sub} />}

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
                  <StatCard icon={DocumentTextIcon} label={t('dashboard.statTotal') || "Total CVs"} value={stats.data?.quickStats.totalCvs.toString() || "0"} color="bg-gradient-to-br from-blue-600 to-blue-500" />
                  <StatCard icon={CheckCircleIcon} label={t('dashboard.completed') || "Completed"} value={stats.data?.quickStats.completedCvs.toString() || "0"} color="bg-gradient-to-br from-emerald-600 to-emerald-500" />
                  <StatCard icon={ClockIcon} label={t('dashboard.draft') || "In Progress"} value={stats.data?.quickStats.draftCvs.toString() || "0"} color="bg-gradient-to-br from-amber-600 to-amber-500" />
                  <StatCard icon={ArrowDownTrayIcon} label={t('dashboard.statDownloads') || "Downloads"} value={stats.data?.quickStats.totalDownloads.toString() || "0"} color="bg-gradient-to-br from-purple-600 to-purple-500" />
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
                      <span className="text-[14px] font-semibold text-txt-muted group-hover:text-blue-500 transition-colors">{t('dashboard.newCV') || 'Create New CV'}</span>
                      <span className="text-[11px] text-txt-dim mt-1">{t('dashboard.newCVDesc') || 'Start from scratch or use a template'}</span>
                    </Link>
                  </motion.div>

                  {filteredDrafts.map((draft, i) => (
                    <CVCard
                      key={draft.id}
                      draft={draft}
                      delay={i + 1}
                      onEdit={() => router.push('/builder?id=' + draft.id)}
                      onDuplicate={async () => {
                        await duplicateDraft(draft.id);
                        dispatch(fetchDashboardStats());
                      }}
                      onDelete={() => setDeleteConfirm(draft.id)}
                    />
                  ))}
                </div>

                {filteredDrafts.length === 0 && searchQuery && (
                  <div className="text-center py-20">
                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-txt-dim mb-3" />
                    <p className="text-txt-muted font-medium">{t('dashboard.noCVsFound') || 'No CVs found matching'} &ldquo;{searchQuery}&rdquo;</p>
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
                  <StatCard icon={EyeIcon} label={t('dashboard.statViews') || "Total Views"} value={stats.data?.quickStats.totalViews.toString() || "0"} color="bg-gradient-to-br from-blue-600 to-blue-500" />
                  <StatCard icon={ArrowDownTrayIcon} label={t('dashboard.statDownloads') || "Total Downloads"} value={stats.data?.quickStats.totalDownloads.toString() || "0"} color="bg-gradient-to-br from-emerald-600 to-emerald-500" />
                  <StatCard icon={ShareIcon} label={t('dashboard.shared') || "Shared Links"} value={stats.data?.quickStats.sharedLinks.toString() || "0"} color="bg-gradient-to-br from-purple-600 to-purple-500" />
                  <StatCard icon={ArrowTrendingUpIcon} label={t('dashboard.statSuccess') || "Profile Score"} value={`${stats.data?.quickStats.profileScore || 0}/100`} color="bg-gradient-to-br from-amber-600 to-amber-500" />
                </div>

                {/* Charts mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Activity Card */}
                  <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                    <h3 className="text-[15px] font-bold text-txt mb-4">{t('dashboard.viewsOverTime') || 'Weekly Activity'}</h3>
                    <div className="flex items-end gap-2 h-40">
                      {stats.data?.weeklyActivity.map((activity, i) => {
                        const maxValue = Math.max(...(stats.data?.weeklyActivity.map(a => a.value) || [1]));
                        const heightPct = activity.value > 0 ? (activity.value / maxValue) * 100 : 0;
                        return (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-lg relative group cursor-pointer hover:from-blue-500 hover:to-cyan-300 transition-all min-h-[4px]"
                          >
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-txt opacity-0 group-hover:opacity-100 transition bg-surface px-1.5 py-0.5 rounded shadow">
                              {activity.value}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] text-txt-dim font-medium">
                      {stats.data?.weeklyActivity.map((activity) => (
                        <span key={activity.day}>{activity.day}</span>
                      ))}
                    </div>
                  </div>

                  {/* Template Popularity */}
                  <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                    <h3 className="text-[15px] font-bold text-txt mb-4">{t('dashboard.overview') || 'Template Usage'}</h3>
                    <div className="space-y-4">
                      {stats.data?.templateUsage.map((t, i) => (
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
                      )) || <div className="text-sm text-txt-dim">No templates used yet.</div>}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl p-6">
                  <h3 className="text-[15px] font-bold text-txt mb-4">{t('dashboard.comingSoon') || 'Recent Activity'}</h3>
                  <div className="space-y-3">
                    {stats.data?.recentActivity.map((item, i) => {
                      let Icon = PlusIcon;
                      let color = 'text-emerald-500 bg-emerald-500/10';
                      if (item.type === 'downloaded') { Icon = ArrowDownTrayIcon; color = 'text-blue-500 bg-blue-500/10'; }
                      else if (item.type === 'edited') { Icon = PencilSquareIcon; color = 'text-amber-500 bg-amber-500/10'; }
                      else if (item.type === 'shared') { Icon = ShareIcon; color = 'text-purple-500 bg-purple-500/10'; }
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 + 0.2 }}
                          className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                        >
                          <div className={`p-2 rounded-lg ${color}`}>
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
                    }) || <div className="text-sm text-txt-dim">No recent activity.</div>}
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
                  title={t('dashboard.appearance') || "Appearance"}
                  description={t('dashboard.themeLanguage') || "Customize how Sira looks"}
                >
                  <SettingsRow label="Theme" description="">
                    <ThemeToggle />
                  </SettingsRow>
                  <SettingsRow label={t('dashboard.language') || "Language"} description="">
                    <LanguageToggle />
                  </SettingsRow>
                  <SettingsRow label={t('dashboard.cvPreviewScale') || "CV Preview Scale"} description={t('dashboard.cvPreviewScaleDesc') || "Default zoom level for CV previews"}>
                    <select defaultValue="100%" className="bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500 transition min-w-[120px]">
                      <option value="75%">75%</option>
                      <option value="100%">100%</option>
                      <option value="125%">125%</option>
                      <option value="150%">150%</option>
                    </select>
                  </SettingsRow>
                </SettingsSection>

                {/* Privacy */}
                <SettingsSection
                  icon={ShieldCheckIcon}
                  title={t('dashboard.securitySettings') || "Privacy & Security"}
                  description=""
                >
                  <SettingsRow label={t('dashboard.twoFactor') || "Two-Factor Authentication"} description={t('dashboard.enableTwoFactor') || "Add an extra layer of security"}>
                    <ToggleSwitch defaultChecked={false} />
                  </SettingsRow>
                  <SettingsRow label={t('dashboard.shareAnalytics') || "Share Analytics"} description="">
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                  <SettingsRow label={t('dashboard.autoSaveDrafts') || "Auto-save Drafts"} description="">
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection
                  icon={BellIcon}
                  title={t('dashboard.notificationsLabel') || "Notifications"}
                  description={t('dashboard.notificationsDesc') || "Manage your notification preferences"}
                >
                  <SettingsRow label={t('dashboard.emailNotifications') || "Email Notifications"} description={t('dashboard.emailNotificationsDesc') || "Receive updates about your account"}>
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                  <SettingsRow label={t('dashboard.newTemplateAlerts') || "New Template Alerts"} description={t('dashboard.newTemplateAlertsDesc') || "Be notified when new templates are available"}>
                    <ToggleSwitch defaultChecked={true} />
                  </SettingsRow>
                  <SettingsRow label={t('dashboard.tipsTutorials') || "Tips & Tutorials"} description={t('dashboard.tipsTutorialsDesc') || "Receive helpful CVs tips and guides"}>
                    <ToggleSwitch defaultChecked={false} />
                  </SettingsRow>
                </SettingsSection>

                {/* Export & Data */}
                <SettingsSection
                  icon={ArrowDownTrayIcon}
                  title={t('dashboard.dataExport') || "Data & Export"}
                  description={t('dashboard.dataExportDesc') || "Manage your data and export options"}
                >
                  <SettingsRow label={t('dashboard.defaultPdfSize') || "Default PDF Size"} description={t('dashboard.defaultPdfSizeDesc') || "Choose default paper size for exports"}>
                    <select defaultValue="A4" className="bg-surface2 border border-border rounded-xl px-3 py-2 text-[12px] text-txt outline-none focus:border-blue-500 transition min-w-[120px]">
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </SettingsRow>
                  <SettingsRow label={t('dashboard.exportAllCvs') || "Export all CVs"} description={t('dashboard.exportAllCvsDesc') || "Download all your CVs as a ZIP archive"}>
                    <button className="px-4 py-2 bg-surface2 border border-border rounded-xl text-[12px] font-medium text-txt hover:border-blue-500/40 transition-colors">
                      {t('dashboard.export') || "Export"}
                    </button>
                  </SettingsRow>
                </SettingsSection>

                {/* Danger Zone */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                  <h3 className="text-[15px] font-bold text-red-500 mb-1">{t('dashboard.dangerZone') || 'Danger Zone'}</h3>
                  <p className="text-[12px] text-txt-muted mb-4">{t('dashboard.deleteAccountDesc') || 'Irreversible actions for your account'}</p>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2.5 bg-surface border border-red-500/20 rounded-xl text-[12px] font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                      {t('dashboard.delete') || 'Delete All CVs'}
                    </button>
                    <button className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-[12px] font-medium hover:bg-red-600 transition-colors">
                      {t('dashboard.deleteAccount') || 'Delete Account'}
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
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          sub.isPro
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                            : 'text-txt-muted bg-surface2'
                        }`}>
                          {sub.isPro && <SparklesIcon className="w-3 h-3" />}
                          {sub.isPro ? (t('dashboard.proPlan') || 'Pro Plan') : (t('dashboard.basicPlan') || 'Basic Plan')}
                        </span>
                        <span className="text-[11px] text-txt-dim">{t('dashboard.memberSince') || "Member since Nov 2025"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Info Form */}
                <ProfileSettingsForm user={user} refreshUser={refreshUser} />

                {/* Password Change */}
                <PasswordChangeForm />
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
              <h3 className="text-[16px] font-bold text-txt mb-1">{t('dashboard.confirmDelete') || 'Delete CV?'}</h3>
              <p className="text-[13px] text-txt-muted mb-5">
                {t('dashboard.confirmDeleteSub') || 'This action cannot be undone. The CV will be permanently removed.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2.5 bg-surface2 border border-border rounded-xl text-[13px] font-medium text-txt hover:bg-surface transition"
                >
                  {t('dashboard.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={async () => {
                    if (deleteConfirm) {
                      await deleteDraft(deleteConfirm);
                      dispatch(fetchDashboardStats());
                    }
                    setDeleteConfirm(null);
                  }}
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-medium hover:bg-red-600 transition"
                >
                  {t('dashboard.delete') || 'Delete'}
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

function FormField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange?: (val: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-txt-muted uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-[13px] text-txt outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-txt-dim"
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-bg text-txt">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
