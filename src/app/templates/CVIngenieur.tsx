'use client';
import { Candidate } from '../data';
import { useLanguage } from '@/app/i18n/LanguageContext';

export function CVIngenieur({ data }: { data: Candidate }) {
  const { t } = useLanguage();
  return (
    <div className="cv-page cv-ingenieur">
      <div className="cv-header">
        <div>
          <div className="cv-name">{data.prenom} {data.nom}</div>
          <div className="cv-title">{data.titre}</div>
        </div>
        <div className="cv-contact-right">
          <div>{data.email}</div>
          <div>{data.telephone}</div>
          <div>{data.ville}</div>
          {data.linkedin && <div>{data.linkedin}</div>}
        </div>
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
                {data.competences.map((s, i) => (
                  <div className="cv-skill-bar" key={i}>
                    <div className="bar-label">{s}</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${75 + Math.round(Math.sin(i * 2.1) * 20)}%` }} /></div>
                  </div>
                ))}
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
                {data.logiciels.map((s, i) => (
                  <div className="cv-skill-bar" key={i}>
                    <div className="bar-label">{s}</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${70 + Math.round(Math.cos(i * 1.8) * 22)}%` }} /></div>
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
