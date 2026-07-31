'use client';
import { Candidate } from '../data';
import { dateRangeLabel } from './dateFormat';
import { renderRichText } from './richText';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { CVStyleConfig } from './styleConfig';
import { CVBlock, CVLayout, block } from './blocks';
import { renderBlocks } from './renderBlocks';
import { Translate } from './types';

function href(url: string) {
  return url.startsWith('http') ? url : `https://${url}`;
}

export function buildExecutifLayout(
  data: Candidate,
  config: CVStyleConfig | undefined,
  t: Translate,
  language: string,
): CVLayout {
  const sideOrder = config?.sideOrder || ['competences', 'langues', 'logiciels'];
  const mainOrder = config?.mainOrder || ['experiences', 'formations'];

  /* ── Sidebar (not paginated: it is a fixed column) ── */
  const renderSideSection = (id: string) => {
    switch (id) {
      case 'competences':
        if (!data.competences?.length) return null;
        return (
          <div key="competences" className="exec-sidebar-section">
            <div className="exec-sidebar-title">{t('builder.skills')}</div>
            <div className="exec-tag-list">
              {data.competences.map((s, i) => (
                <span className="exec-tag" key={i} data-cv-field="competences">{s}</span>
              ))}
            </div>
          </div>
        );
      case 'langues':
        if (!data.langues?.length) return null;
        return (
          <div key="langues" className="exec-sidebar-section">
            <div className="exec-sidebar-title">{t('builder.languages')}</div>
            {data.langues.map((l, i) => (
              <div className="exec-lang-row" key={i}>
                <div className="exec-lang-name" data-cv-field={`langues.${i}.langue`}>{l.langue}</div>
                <div className="exec-lang-detail">
                  {t(`builder.level_${l.niveau}`)}
                  {l.certification && (
                    <>
                      {', '}
                      {l.certificationLink ? (
                        <a href={href(l.certificationLink)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                          {l.certification}{l.score ? ` (${l.score})` : ''}
                        </a>
                      ) : (
                        <span style={{ opacity: 0.85 }}>{l.certification}{l.score ? ` (${l.score})` : ''}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      case 'logiciels':
        if (!data.logiciels?.length) return null;
        return (
          <div key="logiciels" className="exec-sidebar-section">
            <div className="exec-sidebar-title">{t('builder.software')}</div>
            <div className="exec-tag-list">
              {data.logiciels.map((s, i) => (
                <span className="exec-tag exec-tag-soft" key={i} data-cv-field="logiciels">{s}</span>
              ))}
            </div>
          </div>
        );
      case 'experiences':
        if (!data.experiences?.length) return null;
        return (
          <div key="experiences" className="exec-sidebar-section">
            <div className="exec-sidebar-title">{t('builder.experiences')}</div>
            {data.experiences.map((exp, i) => (
              <div className="exec-lang-row" key={i}>
                <div className="exec-lang-name" data-cv-field={`experiences.${i}.poste`}>{exp.poste}</div>
                <div className="exec-lang-detail" data-cv-field={`experiences.${i}.entreprise`}>{exp.entreprise}, {dateRangeLabel(exp, language)}</div>
              </div>
            ))}
          </div>
        );
      case 'formations':
        if (!data.formations?.length) return null;
        return (
          <div key="formations" className="exec-sidebar-section">
            <div className="exec-sidebar-title">{t('builder.education')}</div>
            {data.formations.map((f, i) => (
              <div className="exec-lang-row" key={i}>
                <div className="exec-lang-name" data-cv-field={`formations.${i}.diplome`}>{f.diplome}</div>
                <div className="exec-lang-detail" data-cv-field={`formations.${i}.etablissement`}>{f.etablissement}, {dateRangeLabel(f, language)}</div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const sidebarNode = (
    <>
      <div className="exec-avatar" data-cv-field="prenom">
        <span>{(data.prenom?.[0] || '').toUpperCase()}{(data.nom?.[0] || '').toUpperCase()}</span>
      </div>
      <div className="exec-sidebar-section">
        <div className="exec-sidebar-title">{t('builder.contact')}</div>
        <div className="exec-contact-list">
          <div className="exec-contact-item" data-cv-field="email">
            <svg className="exec-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
            <a href={`mailto:${data.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{data.email}</a>
          </div>
          <div className="exec-contact-item" data-cv-field="telephone">
            <svg className="exec-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            <span>{data.telephone}</span>
          </div>
          <div className="exec-contact-item" data-cv-field="ville">
            <svg className="exec-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            <span>{data.ville}</span>
          </div>
          {data.linkedin && (
            <div className="exec-contact-item" data-cv-field="linkedin">
              <svg className="exec-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd"/></svg>
              <a href={href(data.linkedin)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', wordBreak: 'break-all' }}>
                {data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
        </div>
      </div>
      {sideOrder.map((k) => renderSideSection(k))}
    </>
  );

  /* ── Main column: paginated ── */
  const title = (id: string, group: string, text: string) =>
    block(id, group, <h2 className="exec-section-title">{text}</h2>, {
      wrapperClass: 'exec-section',
      keepWithNext: true,
    });

  const section = (id: string): CVBlock[] => {
    switch (id) {
      case 'experiences': {
        if (!data.experiences?.length) return [];
        return [
          title('exp-title', 'experiences', t('builder.experiences')),
          ...data.experiences.map((exp, i) =>
            block(
              `exp-${i}`,
              'experiences',
              <div className="exec-entry">
                <div className="exec-entry-header">
                  <div>
                    <div className="exec-entry-role" data-cv-field={`experiences.${i}.poste`}>{exp.poste}</div>
                    <div className="exec-entry-company" data-cv-field={`experiences.${i}.entreprise`}>{exp.entreprise}, {exp.secteur}</div>
                  </div>
                  <div className="exec-entry-date" data-cv-field={`experiences.${i}.dateDebut`}>{dateRangeLabel(exp, language)}</div>
                </div>
                <div className="exec-entry-desc" data-cv-field={`experiences.${i}.description`}>{renderRichText(exp.description)}</div>
                {exp.links?.map((link, l) => (
                  <a key={l} href={href(link.url)} target="_blank" rel="noopener noreferrer" className="exec-link">
                    {link.label || link.url}
                  </a>
                ))}
              </div>,
              { wrapperClass: 'exec-section' },
            ),
          ),
        ];
      }
      case 'formations': {
        if (!data.formations?.length) return [];
        return [
          title('edu-title', 'formations', t('builder.education')),
          ...data.formations.map((f, i) =>
            block(
              `edu-${i}`,
              'formations',
              <div className="exec-entry">
                <div className="exec-entry-header">
                  <div>
                    <div className="exec-entry-role" data-cv-field={`formations.${i}.diplome`}>{f.diplome}, {f.specialite}</div>
                    <div className="exec-entry-company" data-cv-field={`formations.${i}.etablissement`}>{f.etablissement}, {f.ville}</div>
                  </div>
                  <div className="exec-entry-date" data-cv-field={`formations.${i}.dateDebut`}>{dateRangeLabel(f, language)}</div>
                </div>
                {f.mention && <span className="exec-mention" data-cv-field={`formations.${i}.mention`}>{f.mention}</span>}
                {f.links?.map((link, l) => (
                  <a key={l} href={href(link.url)} target="_blank" rel="noopener noreferrer" className="exec-link">
                    {link.label || link.url}
                  </a>
                ))}
              </div>,
              { wrapperClass: 'exec-section' },
            ),
          ),
        ];
      }
      case 'competences': {
        if (!data.competences?.length) return [];
        return [
          title('comp-title', 'competences', t('builder.skills')),
          block(
            'comp-list',
            'competences',
            <div className="exec-tag-list" style={{ gap: 5 }}>
              {data.competences.map((s, i) => (
                <span className="exec-tag" key={i} style={{ background: 'var(--cv-accent-10, rgba(59,130,246,0.1))', color: 'var(--cv-accent, #3b82f6)', border: '1px solid var(--cv-accent, #3b82f6)', borderColor: 'rgba(59,130,246,0.2)' }} data-cv-field="competences">{s}</span>
              ))}
            </div>,
            { wrapperClass: 'exec-section' },
          ),
        ];
      }
      case 'langues': {
        if (!data.langues?.length) return [];
        return [
          title('lang-title', 'langues', t('builder.languages')),
          ...data.langues.map((l, i) =>
            block(
              `lang-${i}`,
              'langues',
              <div className="exec-entry" style={{ marginBottom: 6, paddingBottom: 0, borderBottom: 'none' }}>
                <div className="exec-entry-header">
                  <div className="exec-entry-role" data-cv-field={`langues.${i}.langue`}>{l.langue}</div>
                  <div className="exec-entry-date">
                    {t(`builder.level_${l.niveau}`)}
                    {l.certification && `, ${l.certification}${l.score ? ` (${l.score})` : ''}`}
                  </div>
                </div>
              </div>,
              { wrapperClass: 'exec-section' },
            ),
          ),
        ];
      }
      case 'logiciels': {
        if (!data.logiciels?.length) return [];
        return [
          title('log-title', 'logiciels', t('builder.software')),
          block(
            'log-list',
            'logiciels',
            <div className="exec-tag-list" style={{ gap: 5 }}>
              {data.logiciels.map((s, i) => (
                <span className="exec-tag" key={i} style={{ background: 'rgba(59,130,246,0.04)', color: 'var(--cv-accent, #3b82f6)' }} data-cv-field="logiciels">{s}</span>
              ))}
            </div>,
            { wrapperClass: 'exec-section' },
          ),
        ];
      }
      default:
        return [];
    }
  };

  const header = (
    <div className="exec-header">
      <h1 className="exec-name" data-cv-field="prenom">{data.prenom} {data.nom}</h1>
      <div className="exec-title" data-cv-field="titre">{data.titre}</div>
      {data.accroche && <div className="exec-accroche" data-cv-field="accroche">{renderRichText(data.accroche)}</div>}
    </div>
  );

  return {
    pageClass: 'cv-executif',
    // Sections sit directly inside .exec-main; no extra body class needed.
    bodyClass: '',
    // Sections carry their own margins; no extra flex gap.
    columnClass: '',
    singleColumn: true,
    header,
    lead: [],
    main: mainOrder.flatMap(section),
    side: [],
    sidebar: { className: 'exec-sidebar', node: sidebarNode },
  };
}

export function CVExecutif({ data, config }: { data: Candidate; config?: CVStyleConfig }) {
  const { t, language } = useLanguage();
  const layout = buildExecutifLayout(data, config, t, language);

  return (
    <div className="cv-page cv-executif">
      <aside className="exec-sidebar">{layout.sidebar?.node}</aside>
      <main className="exec-main">
        {layout.header}
        <div className={layout.columnClass}>{renderBlocks(layout.main)}</div>
      </main>
    </div>
  );
}
