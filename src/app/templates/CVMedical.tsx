'use client';
import { Candidate } from '../data';
import { EmailIcon, PhoneIcn, LocationIcon, LinkedInIcon } from './ContactIcons';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { CVStyleConfig } from './styleConfig';

export function CVMedical({ data, config }: { data: Candidate, config?: CVStyleConfig }) {
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
            {data.experiences.map((exp, i) => (
              <div className="cv-exp-item" key={`exp-${i}`}>
                <div className="exp-date">{exp.dateDebut} - {exp.dateFin}</div>
                <div className="exp-poste">{exp.poste}</div>
                <div className="exp-company">{exp.entreprise} | {exp.secteur}</div>
                <div className="exp-desc">{exp.description}</div>
              </div>
            ))}
          </div>
        );
      case 'formations':
        if (!data.formations?.length) return null;
        return (
          <div key="formations" className="cv-section-col">
            <div className="cv-section-title">{t('builder.education')}</div>
            {data.formations.map((f, i) => (
              <div className="cv-formation-item" key={`form-${i}`}>
                <div className="year">{f.annee}</div>
                <div className="diploma">{f.diplome} - {f.specialite}</div>
                <div className="school">{f.etablissement}, {f.ville}</div>
              </div>
            ))}
          </div>
        );
      case 'competences':
        if (!data.competences?.length) return null;
        return (
          <div key="competences" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.skills')}</div>
            <div className="cv-skills-list">
              {data.competences.map((s, i) => (<span className="cv-skill-pill" key={`comp-${i}`}>{s}</span>))}
            </div>
          </div>
        );
      case 'langues':
        if (!data.langues?.length) return null;
        return (
          <div key="langues" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.languages')}</div>
            {data.langues.map((l, i) => (
              <div className="cv-lang-item" key={`lang-${i}`}>
                <span>{l.langue}</span>
                <span className="cv-lang-level">{t(`builder.level_${l.niveau}`)}</span>
              </div>
            ))}
          </div>
        );
      case 'logiciels':
        if (!data.logiciels?.length) return null;
        return (
          <div key="logiciels" className="cv-section-col">
            <div className="cv-section-title">{t('builder.software')}</div>
            <div className="cv-skills-list">
              {data.logiciels.map((s, i) => (<span className="cv-skill-pill" key={`log-${i}`}>{s}</span>))}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="cv-page cv-medical">
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
