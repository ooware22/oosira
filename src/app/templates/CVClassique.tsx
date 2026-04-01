'use client';
import { Candidate } from '../data';
import { EmailIcon, PhoneIcn, LocationIcon, LinkedInIcon } from './ContactIcons';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function CVClassique({ data }: { data: Candidate }) {
  const { t } = useLanguage();
  return (
    <div className="cv-page cv-classique">
      <div className="cv-header">
        <div className="cv-name">{data.prenom} {data.nom}</div>
        <div className="cv-title">{data.titre}</div>
        <div className="cv-contact-row">
          <span><EmailIcon />{data.email}</span>
          <span><PhoneIcn />{data.telephone}</span>
          <span><LocationIcon />{data.ville}</span>
          {data.linkedin && <span><LinkedInIcon />{data.linkedin}</span>}
        </div>
      </div>
      <div className="cv-body">
        {data.accroche && <div className="cv-accroche">{data.accroche}</div>}
        {data.experiences.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="cv-section-title">{t('builder.experiences')}</div>
            {data.experiences.map((exp, i) => (
              <div className="cv-exp-item" key={i}>
                <div className="exp-header">
                  <span className="exp-poste">{exp.poste}</span>
                  <span className="exp-date">{exp.dateDebut} - {exp.dateFin}</span>
                </div>
                <div className="exp-company">{exp.entreprise} | {exp.secteur}</div>
                <div className="exp-desc">{exp.description}</div>
              </div>
            ))}
          </div>
        )}
        <div className="cv-grid">
          <div>
            {data.formations.length > 0 && (
              <>
                <div className="cv-section-title">{t('builder.education')}</div>
                {data.formations.map((f, i) => (
                  <div className="cv-formation-item" key={i}>
                    <div className="year">{f.annee}</div>
                    <div className="diploma">{f.diplome} - {f.specialite}</div>
                    <div className="school">{f.etablissement}, {f.ville}</div>
                    {f.mention && <div className="mention-badge">{f.mention}</div>}
                  </div>
                ))}
              </>
            )}
          </div>
          <div>
            {data.competences.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="cv-section-title">{t('builder.skills')}</div>
                <div className="cv-skills-list">
                  {data.competences.map((s, i) => (<span className="cv-skill-pill" key={i}>{s}</span>))}
                </div>
              </div>
            )}
            {data.langues.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div className="cv-section-title">{t('builder.languages')}</div>
                {data.langues.map((l, i) => (
                  <div className="cv-lang-item" key={i}>
                    <span>{l.langue}</span>
                    <span className="cv-lang-level">{t(`builder.level_${l.niveau}`)}</span>
                  </div>
                ))}
              </div>
            )}
            {data.logiciels.length > 0 && (
              <>
                <div className="cv-section-title">{t('builder.software')}</div>
                <div className="cv-skills-list">
                  {data.logiciels.map((s, i) => (
                    <span className="cv-skill-pill" key={i} style={{ background: 'rgba(37,99,235,0.06)', color: '#1D4ED8' }}>{s}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
