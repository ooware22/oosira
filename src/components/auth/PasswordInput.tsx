'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/app/i18n/LanguageContext';

/** Password field with a show/hide toggle, so typos can be checked on a phone. */
export default function PasswordInput({ value, onChange, invalid, autoComplete, placeholder = '••••••••' }: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const label = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        className={`w-full bg-surface2 border rounded-xl ps-4 pe-11 py-3.5 text-sm text-txt outline-none transition-all duration-200 focus:ring-4 placeholder:text-txt-dim ${
          invalid ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10' : 'border-border focus:border-blue-500 focus:ring-blue-500/10'
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? label('auth.hide_password', 'Masquer le mot de passe') : label('auth.show_password', 'Afficher le mot de passe')}
        className="absolute inset-y-0 end-0 px-3.5 flex items-center text-txt-muted hover:text-txt"
      >
        {visible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
      </button>
    </div>
  );
}
