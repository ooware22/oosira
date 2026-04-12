'use client';
import { Candidate } from '../data';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { CVStyleConfig } from './styleConfig';

export function CVIngenieur({ data, config }: { data: Candidate, config?: CVStyleConfig }) {
  const { t } = useLanguage();
  const mainOrder = config?.mainOrder || ['experiences', 'formations'];
  const sideOrder = config?.sideOrder || ['competences', 'langues', 'logiciels'];

  const renderSection = (id: string) => {
    switch(id) {
      case 'experiences':
        if (!data.experiences?.length) return null;
        return (
          <div key="experiences" className="cv-section-col" style={{ marginBottom: 16 }}>
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
        );
      case 'formations':
        if (!data.formations?.length) return null;
        return (
          <div key="formations" className="cv-section-col mb-4">
            <div className="cv-section-title">{t('builder.education')}</div>
            {data.formations.map((f, i) => (
              <div className="cv-formation-item" key={i}>
                <div className="year">{f.annee}</div>
                <div className="diploma">{f.diplome} - {f.specialite}</div>
                <div className="school">{f.etablissement}, {f.ville}</div>
                {f.mention && <div className="mention-badge">{f.mention}</div>}
              </div>
            ))}
          </div>
        );
      case 'competences':
        if (!data.competences?.length) return null;
        return (
          <div key="competences" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.skills')}</div>
            {data.competences.map((s, i) => (
              <div className="cv-skill-bar" key={i}>
                <div className="bar-label">{s}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${75 + Math.round(Math.sin(i * 2.1) * 20)}%` }} /></div>
              </div>
            ))}
          </div>
        );
      case 'langues':
        if (!data.langues?.length) return null;
        return (
          <div key="langues" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.languages')}</div>
            {data.langues.map((l, i) => (
              <div className="cv-lang-item" key={i}>
                <span>{l.langue}</span>
                <span className="cv-lang-level">{t(`builder.level_${l.niveau}`)}</span>
              </div>
            ))}
          </div>
        );
      case 'logiciels':
        if (!data.logiciels?.length) return null;
        return (
          <div key="logiciels" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.software')}</div>
            {data.logiciels.map((s, i) => (
              <div className="cv-skill-bar" key={i}>
                <div className="bar-label">{s}</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${70 + Math.round(Math.cos(i * 1.8) * 22)}%` }} /></div>
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

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
        {config?.layoutCols === '1' ? (
          <div className="flex flex-col gap-4">
             {[...mainOrder, ...sideOrder].map(k => renderSection(k))}
          </div>
        ) : (
          <div className="cv-grid">
            <div className="flex flex-col gap-4">
              {mainOrder.map(k => renderSection(k))}
            </div>
            <div className="flex flex-col gap-4">
              {sideOrder.map(k => renderSection(k))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
