'use client';
import { Candidate } from '../data';
import { EmailIcon, PhoneIcn, LocationIcon, LinkedInIcon, ProjectLinkIcon } from './ContactIcons';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { CVStyleConfig } from './styleConfig';

function langDots(niveau: string) {
  const map: Record<string, number> = { Natif: 5, Courant: 4, Intermediaire: 3, Technique: 3, Debutant: 1 };
  const filled = map[niveau] ?? 2;
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`lang-dot${i < filled ? ' filled' : ''}`} />
  ));
}

export function CVCadre({ data, config }: { data: Candidate, config?: CVStyleConfig }) {
  const { t } = useLanguage();
  const sideOrder = config?.sideOrder || ['competences', 'langues', 'logiciels'];
  const mainOrder = config?.mainOrder || ['experiences', 'formations'];

  const renderSection = (id: string, inSidebar: boolean) => {
    switch(id) {
      case 'experiences':
        if (!data.experiences?.length) return null;
        return (
          <div key="experiences" style={{ marginBottom: 16 }}>
            <div className={inSidebar ? "sidebar-section-title" : "cv-section-title"}>{t('builder.experiences')}</div>
            {data.experiences.map((exp, i) => (
              <div className="cv-exp-item" key={`exp-${i}`}>
                <div className="exp-date-badge">{exp.dateDebut} - {exp.dateFin}</div>
                <div className="exp-poste">{exp.poste}</div>
                <div className="exp-company">{exp.entreprise} | {exp.secteur}</div>
                <div className="exp-desc">{exp.description}</div>
                {exp.links?.map((link, lIdx) => (
                  <a key={`l-${lIdx}`} href={link.url} target="_blank" rel="noopener noreferrer" className="cv-link" style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}><ProjectLinkIcon /></span> {link.label || link.url}
                  </a>
                ))}
              </div>
            ))}
          </div>
        );
      case 'formations':
        if (!data.formations?.length) return null;
        return (
          <div key="formations" style={{ marginBottom: 16 }}>
            <div className={inSidebar ? "sidebar-section-title" : "cv-section-title"}>{t('builder.education')}</div>
            {data.formations.map((f, i) => (
              <div className="cv-formation-item" key={`form-${i}`}>
                <div className="year">{f.annee}</div>
                <div className="diploma">{f.diplome} - {f.specialite}</div>
                <div className="school">{f.etablissement}, {f.ville}</div>
                {f.links?.map((link, lIdx) => (
                  <a key={`fl-${lIdx}`} href={link.url} target="_blank" rel="noopener noreferrer" className="cv-link" style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
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
          <div key="competences" style={{ marginBottom: 16 }}>
            <div className={inSidebar ? "sidebar-section-title" : "cv-section-title"}>{t('builder.skills')}</div>
            <div>{data.competences.map((s, i) => (<span className="skill-tag" key={`comp-${i}`}>{s}</span>))}</div>
          </div>
        );
      case 'langues':
        if (!data.langues?.length) return null;
        return (
           <div key="langues" style={{ marginBottom: 16 }}>
            <div className={inSidebar ? "sidebar-section-title" : "cv-section-title"}>{t('builder.languages')}</div>
            {data.langues.map((l, i) => (
              <div className="cv-lang-row" key={`lang-${i}`}>
                <div className="cv-lang-name">{l.langue}</div>
                <div className="lang-dots">{langDots(l.niveau)}</div>
              </div>
            ))}
          </div>
        );
      case 'logiciels':
        if (!data.logiciels?.length) return null;
        return (
          <div key="logiciels" style={{ marginBottom: 16 }}>
            <div className={inSidebar ? "sidebar-section-title" : "cv-section-title"}>{t('builder.software')}</div>
            <div>{data.logiciels.map((s, i) => (<span className="skill-tag" key={`log-${i}`}>{s}</span>))}</div>
          </div>
        );
      default: return null;
    }
  };

  const isOneCol = config?.layoutCols === '1';

  return (
    <div className={`cv-page cv-cadre ${isOneCol ? '!flex-col' : ''}`} style={isOneCol ? { display: 'flex', flexDirection: 'column' } : undefined}>
      {(!isOneCol || data.email || data.telephone || data.ville) && (
        <div className="cv-sidebar" style={isOneCol ? { width: '100%', paddingBottom: '12px' } : undefined}>
          <div className="cv-name">{data.prenom}{!isOneCol && <br />}{isOneCol && ' '}{data.nom}</div>
          <div className="cv-title">{data.titre}</div>
          
          <div className={isOneCol ? "flex flex-wrap gap-4 mt-2" : "mt-6"}>
            {data.telephone && <div className="contact-item"><span className="contact-icon"><PhoneIcn /></span> {data.telephone}</div>}
            {data.email && <div className="contact-item"><span className="contact-icon"><EmailIcon /></span> <a href={`mailto:${data.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{data.email}</a></div>}
            {data.ville && <div className="contact-item"><span className="contact-icon"><LocationIcon /></span> {data.ville}</div>}
            {data.linkedin && <div className="contact-item"><span className="contact-icon"><LinkedInIcon /></span> <a href={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a></div>}
          </div>
          
          {!isOneCol && sideOrder.map(k => renderSection(k, true))}
        </div>
      )}
      
      <div className="cv-content">
        {data.accroche && (
          <div style={{ marginBottom: 16 }}>
            <div className="cv-section-title">{t('builder.summary')}</div>
            <div className="cv-accroche">{data.accroche}</div>
          </div>
        )}
        {isOneCol ? [...mainOrder, ...sideOrder].map(k => renderSection(k, false)) : mainOrder.map(k => renderSection(k, false))}
      </div>
    </div>
  );
}
