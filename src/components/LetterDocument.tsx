import { renderRichText } from '@/app/templates/richText';

export type LetterPayload = {
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  candidateLinkedin?: string;
  companyName: string;
  jobTitle?: string;
  language: 'fr' | 'en' | 'ar';
  bodyText: string;
};

const LOCALE_BY_LANGUAGE: Record<LetterPayload['language'], string> = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-DZ',
};

const RECIPIENT_LABEL: Record<LetterPayload['language'], (company: string) => string> = {
  fr: (company) => `À l'attention du service recrutement — ${company}`,
  en: (company) => `Attn: Hiring Team — ${company}`,
  ar: (company) => `إلى: فريق التوظيف — ${company}`,
};

export default function LetterDocument({ payload }: { payload: LetterPayload }) {
  const dir = payload.language === 'ar' ? 'rtl' : 'ltr';
  const locale = LOCALE_BY_LANGUAGE[payload.language] || 'fr-FR';
  const dateText = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const contactParts = [payload.candidateEmail, payload.candidatePhone, payload.candidateLinkedin].filter(Boolean);

  return (
    <div className="letter-page" dir={dir}>
      <div className="letter-header">
        <div style={{ fontSize: '19px', fontWeight: 700 }}>{payload.candidateName}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
            {contactParts.join(' · ')}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#555', marginTop: '18px' }}>{dateText}</div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, marginTop: '18px' }}>
          {RECIPIENT_LABEL[payload.language](payload.companyName)}
        </div>
      </div>
      {/* renderRichText, not raw pre-wrap text: the letter is edited in a
          rich-text field now, so its stored value can carry **bold**,
          *italic* and "- " bullets that must print as formatting rather
          than as literal markers. */}
      <div className="letter-body" style={{ fontSize: '13.5px', lineHeight: 1.7 }}>
        {renderRichText(payload.bodyText)}
      </div>
    </div>
  );
}
