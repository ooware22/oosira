'use client';
import { Candidate } from '../data';
import { ProjectLinkIcon } from './ContactIcons';
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

function LinkRow({ url, label }: { url: string; label?: string }) {
  return (
    <a href={href(url)} target="_blank" rel="noopener noreferrer" className="cv-link" style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
      <span style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center' }}><ProjectLinkIcon /></span> {label || url}
    </a>
  );
}

export function buildIngenieurLayout(
  data: Candidate,
  config: CVStyleConfig | undefined,
  t: Translate,
  language: string,
): CVLayout {
  const mainOrder = config?.mainOrder || ['experiences', 'formations'];
  const sideOrder = config?.sideOrder || ['competences', 'langues', 'logiciels'];

  const title = (id: string, group: string, text: string) =>
    block(id, group, <div className="cv-section-title">{text}</div>, {
      wrapperClass: 'cv-section-col',
      keepWithNext: true,
    });

  const section = (id: string): CVBlock[] => {
    switch (id) {
      case 'experiences': {
        if (!data.experiences?.length) return [];
        return [
          title('exp-title', 'experiences', t('builder.experiences')),
          // innerClass keeps the timeline rail wrapping the entries — and lets
          // it restart cleanly on each page rather than spanning a break.
          ...data.experiences.map((exp, i) =>
            block(
              `exp-${i}`,
              'experiences',
              <div className="cv-timeline-item">
                <div className="tl-date" data-cv-field={`experiences.${i}.dateDebut`}>{dateRangeLabel(exp, language)}</div>
                <div className="tl-title" data-cv-field={`experiences.${i}.poste`}>{exp.poste}</div>
                <div className="tl-company" data-cv-field={`experiences.${i}.entreprise`}>{exp.entreprise} | {exp.secteur}</div>
                <div className="tl-desc" data-cv-field={`experiences.${i}.description`}>{renderRichText(exp.description)}</div>
                {exp.links?.map((link, l) => <LinkRow key={l} url={link.url} label={link.label} />)}
              </div>,
              { wrapperClass: 'cv-section-col', innerClass: 'cv-timeline' },
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
              <div className="cv-formation-item">
                <div className="year" data-cv-field={`formations.${i}.dateDebut`}>{dateRangeLabel(f, language)}</div>
                <div className="diploma" data-cv-field={`formations.${i}.diplome`}>{f.diplome} - {f.specialite}</div>
                <div className="school" data-cv-field={`formations.${i}.etablissement`}>{f.etablissement}, {f.ville}</div>
                {f.mention && <div className="mention-badge" data-cv-field={`formations.${i}.mention`}>{f.mention}</div>}
                {f.links?.map((link, l) => <LinkRow key={l} url={link.url} label={link.label} />)}
              </div>,
              { wrapperClass: 'cv-section-col' },
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {data.competences.map((s, i) => (
                <span className="skill-tag" key={i} data-cv-field="competences">{s}</span>
              ))}
            </div>,
            { wrapperClass: 'cv-section-col' },
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
              <div className="cv-lang-item">
                <span data-cv-field={`langues.${i}.langue`}>{l.langue}</span>
                <span className="cv-lang-level">
                  {t(`builder.level_${l.niveau}`)}
                  {l.certification && (
                    <>
                      {', '}
                      {l.certificationLink ? (
                        <a href={href(l.certificationLink)} target="_blank" rel="noopener noreferrer" className="cv-link" style={{ fontWeight: 500 }}>
                          {l.certification}{l.score ? ` (${l.score})` : ''}
                        </a>
                      ) : (
                        <span style={{ fontStyle: 'italic', opacity: 0.85 }}>{l.certification}{l.score ? ` (${l.score})` : ''}</span>
                      )}
                    </>
                  )}
                </span>
              </div>,
              { wrapperClass: 'cv-section-col' },
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {data.logiciels.map((s, i) => (
                <span className="skill-tag" key={i} data-cv-field="logiciels">{s}</span>
              ))}
            </div>,
            { wrapperClass: 'cv-section-col' },
          ),
        ];
      }
      default:
        return [];
    }
  };

  const header = (
    <div className="cv-header">
      <div>
        <div className="cv-name" data-cv-field="prenom">{data.prenom} {data.nom}</div>
        <div className="cv-title" data-cv-field="titre">{data.titre}</div>
      </div>
      <div className="cv-contact-right">
        <div data-cv-field="email"><a href={`mailto:${data.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{data.email}</a></div>
        <div data-cv-field="telephone">{data.telephone}</div>
        <div data-cv-field="ville">{data.ville}</div>
        {data.linkedin && <div data-cv-field="linkedin"><a href={href(data.linkedin)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{data.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a></div>}
      </div>
    </div>
  );

  const lead: CVBlock[] = data.accroche
    ? [block('accroche', 'accroche', <div className="cv-accroche" data-cv-field="accroche">{renderRichText(data.accroche)}</div>)]
    : [];

  return {
    pageClass: 'cv-ingenieur',
    bodyClass: 'cv-body',
    gridClass: 'cv-grid',
    columnClass: 'flex flex-col gap-4',
    singleColumn: config?.layoutCols === '1',
    header,
    lead,
    main: mainOrder.flatMap(section),
    side: sideOrder.flatMap(section),
  };
}

export function CVIngenieur({ data, config }: { data: Candidate, config?: CVStyleConfig }) {
  const { t, language } = useLanguage();
  const layout = buildIngenieurLayout(data, config, t, language);

  return (
    <div className="cv-page cv-ingenieur">
      {layout.header}
      <div className={layout.bodyClass}>
        {renderBlocks(layout.lead)}
        {layout.singleColumn ? (
          <div className={layout.columnClass}>{renderBlocks([...layout.main, ...layout.side])}</div>
        ) : (
          <div className={layout.gridClass}>
            <div className={layout.columnClass}>{renderBlocks(layout.main)}</div>
            <div className={layout.columnClass}>{renderBlocks(layout.side)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
