'use client';

import { useState } from 'react';
import InfoPageShell from '@/components/InfoPageShell';

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate with backend API endpoint
    const mailto = `mailto:contact@oosira.com?subject=${encodeURIComponent(formState.subject)}&body=${encodeURIComponent(`De: ${formState.name} (${formState.email})\n\n${formState.message}`)}`;
    window.open(mailto, '_blank');
    setSubmitted(true);
  };

  return (
    <InfoPageShell title="Contactez-nous">
      <p className="!text-[16px] !text-txt-muted !mb-10">
        Une question, une suggestion ou un partenariat ? N&apos;hésitez pas à nous écrire.
        Nous vous répondrons dans les plus brefs délais.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* ── Contact Form ── */}
        <div>
          {submitted ? (
            <div className="p-8 rounded-2xl bg-surface border border-green-500/20 text-center">
              <div className="text-4xl mb-4">✓</div>
              <p className="text-[16px] font-semibold text-txt mb-2">Message envoyé !</p>
              <p className="text-[14px] text-txt-muted">
                Merci de nous avoir contactés. Nous reviendrons vers vous rapidement.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-[13px] font-medium text-txt mb-1.5">Nom complet</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-txt text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-[13px] font-medium text-txt mb-1.5">E-mail</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState(s => ({ ...s, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-txt text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-[13px] font-medium text-txt mb-1.5">Sujet</label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={formState.subject}
                  onChange={(e) => setFormState(s => ({ ...s, subject: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-txt text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  placeholder="Sujet de votre message"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-[13px] font-medium text-txt mb-1.5">Message</label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState(s => ({ ...s, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-txt text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
                  placeholder="Décrivez votre demande..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-[14px] hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              >
                Envoyer le message
              </button>
            </form>
          )}
        </div>

        {/* ── Contact Info ── */}
        <div className="space-y-8">
          <div className="p-6 rounded-2xl bg-surface border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-txt">E-mail</p>
                <a href="mailto:contact@oosira.com" className="text-[14px] text-blue-500 hover:underline">contact@oosira.com</a>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-txt">Temps de réponse</p>
                <p className="text-[14px] text-txt-muted">Sous 24 à 48 heures ouvrables</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-txt">Sécurité</p>
                <p className="text-[14px] text-txt-muted">
                  Signalement de vulnérabilités :{' '}
                  <a href="mailto:security@oosira.com" className="text-green-500 hover:underline">security@oosira.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InfoPageShell>
  );
}
