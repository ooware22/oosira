'use client';
import { Candidate } from '../data';
import { EmailIcon, PhoneIcn, LocationIcon, LinkedInIcon } from './ContactIcons';
import { useLanguage } from '@/app/i18n/LanguageContext';

function langBarWidth(niveau: string) {
  const map: Record<string, number> = { Natif: 98, Courant: 85, Intermediaire: 60, Technique: 55, Debutant: 25 };
  return map[niveau] ?? 50;
}

export function CVTech({ data }: { data: Candidate }) {
  const { t } = useLanguage();
  return (
    <div className="cv-page cv-tech">
      <div className="cv-header">
        <div className="cv-name">{data.prenom} {data.nom}</div>
        <div className="cv-title">{data.titre}</div>
        <div className="cv-contact-row">
          <span><EmailIcon />{data.email}</span>
          <span><PhoneIcn />{data.telephone}</span>
          <span><LocationIcon />{data.ville}</span>
          {data.linkedin && <span><LinkedInIcon />{data.linkedin}</span>}
        </div>
        {data.competences.length > 0 && (
          <div className="cv-tech-tags">
            {data.competences.slice(0, 8).map((s, i) => (<span className="tech-tag" key={i}>{s}</span>))}
          </div>
        )}
      </div>
      <div className="cv-body">
        {data.accroche && <div className="cv-accroche">{data.accroche}</div>}
        <div className="cv-grid">
          <div>
            {data.experiences.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="cv-section-title">{t('builder.experiences')}</div>
                <div className="cv-timeline">
                  {data.experiences.map((exp, i) => (
                    <div className="cv-timeline-item" key={i}>
                      <div className="tl-date">{exp.dateDebut} - {exp.dateFin}</div>
                      <div className="tl-title">{exp.poste}</div>
                      <div className="tl-company">{exp.entreprise} | {exp.secteur}</div>
                      <div className="tl-desc">{exp.description}</div>
                    </div>
                  ))}
                </div>
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
          <div>
            {data.competences.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="cv-section-title">{t('builder.skills')}</div>
                <div>{data.competences.map((s, i) => (<span className="cv-skill-highlight" key={i}>{s}</span>))}</div>
              </div>
            )}
            {data.logiciels.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="cv-section-title">{t('builder.software')}</div>
                <div>{data.logiciels.map((s, i) => (<span className="cv-skill-highlight" key={i}>{s}</span>))}</div>
              </div>
            )}
            {data.langues.length > 0 && (
              <>
                <div className="cv-section-title">{t('builder.languages')}</div>
                {data.langues.map((l, i) => (
                  <div className="cv-lang-bar" key={i}>
                    <div className="bar-label">{l.langue} - {t(`builder.level_${l.niveau}`)}</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${langBarWidth(l.niveau)}%` }} /></div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
