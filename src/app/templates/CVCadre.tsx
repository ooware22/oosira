'use client';
import { Candidate } from '../data';
import { EmailIcon, PhoneIcn, LocationIcon, LinkedInIcon } from './ContactIcons';
import { useLanguage } from '@/app/i18n/LanguageContext';

function langDots(niveau: string) {
  const map: Record<string, number> = { Natif: 5, Courant: 4, Intermediaire: 3, Technique: 3, Debutant: 1 };
  const filled = map[niveau] ?? 2;
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`lang-dot${i < filled ? ' filled' : ''}`} />
  ));
}

export function CVCadre({ data }: { data: Candidate }) {
  const { t } = useLanguage();
  return (
    <div className="cv-page cv-cadre">
      <div className="cv-sidebar">
        <div className="cv-name">{data.prenom}<br />{data.nom}</div>
        <div className="cv-title">{data.titre}</div>
        <div className="sidebar-section-title">{t('builder.personal_info')}</div>
        <div className="contact-item"><span className="contact-icon"><EmailIcon /></span> {data.email}</div>
        <div className="contact-item"><span className="contact-icon"><PhoneIcn /></span> {data.telephone}</div>
        <div className="contact-item"><span className="contact-icon"><LocationIcon /></span> {data.ville}</div>
        {data.linkedin && <div className="contact-item"><span className="contact-icon"><LinkedInIcon /></span> {data.linkedin}</div>}
        {data.langues.length > 0 && (
          <>
            <div className="sidebar-section-title">{t('builder.languages')}</div>
            {data.langues.map((l, i) => (
              <div className="cv-lang-row" key={i}>
                <div className="cv-lang-name">{l.langue}</div>
                <div className="lang-dots">{langDots(l.niveau)}</div>
              </div>
            ))}
          </>
        )}
        {data.competences.length > 0 && (
          <>
            <div className="sidebar-section-title">{t('builder.skills')}</div>
            <div>{data.competences.map((s, i) => (<span className="skill-tag" key={i}>{s}</span>))}</div>
          </>
        )}
        {data.logiciels.length > 0 && (
          <>
            <div className="sidebar-section-title">{t('builder.software')}</div>
            <div>{data.logiciels.map((s, i) => (<span className="skill-tag" key={i}>{s}</span>))}</div>
          </>
        )}
      </div>
      <div className="cv-content">
        {data.accroche && (<><div className="cv-section-title">{t('builder.summary')}</div><div className="cv-accroche">{data.accroche}</div></>)}
        {data.experiences.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="cv-section-title">{t('builder.experiences')}</div>
            {data.experiences.map((exp, i) => (
              <div className="cv-exp-item" key={i}>
                <div className="exp-date-badge">{exp.dateDebut} - {exp.dateFin}</div>
                <div className="exp-poste">{exp.poste}</div>
                <div className="exp-company">{exp.entreprise} | {exp.secteur}</div>
                <div className="exp-desc">{exp.description}</div>
              </div>
            ))}
          </div>
        )}
        {data.formations.length > 0 && (
          <>
            <div className="cv-section-title">{t('builder.education')}</div>
            {data.formations.map((f, i) => (
              <div className="cv-formation-item" key={i}>
                <div className="year">{f.annee}</div>
                <div className="diploma">{f.diplome} - {f.specialite}</div>
                <div className="school">{f.etablissement}, {f.ville}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
