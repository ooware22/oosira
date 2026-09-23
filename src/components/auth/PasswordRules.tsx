'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { MIN_PASSWORD_LENGTH, passwordRuleState } from '@/app/lib/authErrors';

/**
 * Live checklist under a new-password field: the rules turn green as they are
 * met, so nobody discovers them only after submitting. The last line covers
 * what only the server can judge (common passwords, closeness to the name or
 * email); if it refuses one, the form says which rule failed.
 */
export default function PasswordRules({ password }: { password: string }) {
  const { t } = useLanguage();
  const state = passwordRuleState(password);
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  const rules = [
    { ok: state.length, label: tr('auth.pw_rule_length', 'Au moins {n} caractères').replace('{n}', String(MIN_PASSWORD_LENGTH)) },
    { ok: state.notNumeric, label: tr('auth.pw_rule_not_numeric', 'Pas uniquement des chiffres') },
  ];

  return (
    <div className="mt-2 space-y-1">
      {rules.map((r) => (
        <p key={r.label} className={`flex items-center gap-1.5 text-[11px] transition-colors ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-txt-muted'}`}>
          <CheckCircleIcon className={`w-3.5 h-3.5 shrink-0 ${r.ok ? '' : 'opacity-30'}`} />
          {r.label}
        </p>
      ))}
      <p className="text-[11px] text-txt-muted leading-relaxed">
        {tr('auth.pw_rule_hint', 'Évitez les mots de passe courants (123456789, motdepasse…) et votre nom ou votre e-mail.')}
      </p>
    </div>
  );
}
