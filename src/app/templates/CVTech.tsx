'use client';
import { Candidate } from '../data';
import { EmailIcon, PhoneIcn, LocationIcon, LinkedInIcon, ProjectLinkIcon } from './ContactIcons';
import { fmtDate } from './dateFormat';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { CVStyleConfig } from './styleConfig';

function langBarWidth(niveau: string) {
  const map: Record<string, number> = { Natif: 98, Courant: 85, Intermediaire: 60, Technique: 55, Debutant: 25 };
  return map[niveau] ?? 50;
}

export function CVTech({ data, config }: { data: Candidate, config?: CVStyleConfig }) {
  const { t } = useLanguage();
  const mainOrder = config?.mainOrder || ['experiences', 'formations'];
  const sideOrder = config?.sideOrder || ['competences', 'logiciels', 'langues'];

  const renderSection = (id: string) => {
    switch(id) {
      case 'experiences':
        if (!data.experiences?.length) return null;
        return (
          <div key="experiences" className="cv-section-col" style={{ marginBottom: 16 }}>
            <div className="cv-section-title">{t('builder.experiences')}</div>
            <div className="cv-timeline">
              {data.experiences.map((exp, i) => (
                <div className="cv-timeline-item" key={`exp-${i}`}>
                  <div className="tl-date" data-cv-field={`experiences.${i}.dateDebut`}>{fmtDate(exp.dateDebut)} - {fmtDate(exp.dateFin)}</div>
                  <div className="tl-title" data-cv-field={`experiences.${i}.poste`}>{exp.poste}</div>
                  <div className="tl-company" data-cv-field={`experiences.${i}.entreprise`}>{exp.entreprise} | {exp.secteur}</div>
                  <div className="tl-desc" data-cv-field={`experiences.${i}.description`}>{exp.description}</div>
                  {exp.links?.map((link, lIdx) => (
                    <a key={`l-${lIdx}`} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="cv-link" style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}><ProjectLinkIcon /></span> {link.label || link.url}
                    </a>
                  ))}
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
              <div className="cv-formation-item" key={`form-${i}`}>
                <div className="year" data-cv-field={`formations.${i}.dateDebut`}>{f.dateDebut && f.dateFin ? `${fmtDate(f.dateDebut)} - ${fmtDate(f.dateFin)}` : f.annee}</div>
                <div className="diploma" data-cv-field={`formations.${i}.diplome`}>{f.diplome} - {f.specialite}</div>
                <div className="school" data-cv-field={`formations.${i}.etablissement`}>{f.etablissement}, {f.ville}</div>
                {f.links?.map((link, lIdx) => (
                  <a key={`fl-${lIdx}`} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="cv-link" style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                     <span style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}><ProjectLinkIcon /></span> {link.label || link.url}
                  </a>
                ))}
              </div>
            ))}
          </div>
        );
      case 'competences':
        if (!data.competences?.length) return null;
        return (
          <div key="competences" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.skills')}</div>
            <div>{data.competences.map((s, i) => (<span className="cv-skill-highlight" key={`comp-${i}`} data-cv-field="competences">{s}</span>))}</div>
          </div>
        );
      case 'logiciels':
        if (!data.logiciels?.length) return null;
        return (
          <div key="logiciels" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.software')}</div>
            <div>{data.logiciels.map((s, i) => (<span className="cv-skill-highlight" key={`logiciel-${i}`} data-cv-field="logiciels">{s}</span>))}</div>
          </div>
        );
      case 'langues':
        if (!data.langues?.length) return null;
        return (
          <div key="langues" className="cv-section-col" style={{ marginBottom: 14 }}>
            <div className="cv-section-title">{t('builder.languages')}</div>
            {data.langues.map((l, i) => (
              <div className="cv-lang-bar" key={`lang-${i}`}>
                <div className="bar-label" data-cv-field={`langues.${i}.langue`}>
                  {l.langue} - {t(`builder.level_${l.niveau}`)}
                  {l.certification && (
                    <>
                      {', '}
                      {l.certificationLink ? (
                        <a href={l.certificationLink.startsWith('http') ? l.certificationLink : `https://${l.certificationLink}`} target="_blank" rel="noopener noreferrer" className="cv-link" style={{ fontWeight: 500 }}>
                          {l.certification}{l.score ? ` (${l.score})` : ''}
                        </a>
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.85 }}>{l.certification}{l.score ? ` (${l.score})` : ''}</span>
                      )}
                    </>
                  )}
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${langBarWidth(l.niveau)}%` }} /></div>
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="cv-page cv-tech">
      <div className="cv-header">
        <div className="cv-name" data-cv-field="prenom">{data.prenom} {data.nom}</div>
        <div className="cv-title" data-cv-field="titre">{data.titre}</div>
        <div className="cv-contact-row">
          <span data-cv-field="email"><EmailIcon /><a href={`mailto:${data.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{data.email}</a></span>
          <span data-cv-field="telephone"><PhoneIcn />{data.telephone}</span>
          <span data-cv-field="ville"><LocationIcon />{data.ville}</span>
          {data.linkedin && (
            <a href={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none', color: 'inherit'}}>
              <span data-cv-field="linkedin"><LinkedInIcon />{data.linkedin}</span>
            </a>
          )}
        </div>
        {data.competences.length > 0 && (
          <div className="cv-tech-tags">
            {data.competences.slice(0, 8).map((s, i) => (<span className="tech-tag" key={i} data-cv-field="competences">{s}</span>))}
          </div>
        )}
      </div>
      <div className="cv-body">
        {data.accroche && <div className="cv-accroche" data-cv-field="accroche">{data.accroche}</div>}
        
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
