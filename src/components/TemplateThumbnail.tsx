'use client';

/**
 * Premium CV Template Thumbnails
 * Renders a realistic miniature CV preview for each template style.
 * All colors are dynamic and driven by the palette system.
 */

interface ThumbnailProps {
  templateId: number;
  primary: string;
  accent: string;
  headerBg: string;
}

/* â”€â”€ Shared micro-elements â”€â”€ */
const Lines = ({ color = '#e5e7eb', count = 3, widths }: { color?: string; count?: number; widths?: string[] }) => (
  <div className="space-y-[3px]">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-full" style={{ height: 2, width: widths?.[i] || '100%', background: color, opacity: 0.7 }} />
    ))}
  </div>
);

const SectionLabel = ({ color, width = '40%' }: { color: string; width?: string }) => (
  <div className="mb-[5px] mt-[6px]">
    <div className="rounded-sm" style={{ height: 3, width, background: color, opacity: 0.8 }} />
  </div>
);

const Avatar = ({ bg, size = 22, text = '#fff' }: { bg: string; size?: number; text?: string }) => (
  <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: bg }}>
    <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 16 16" fill={text} opacity={0.7}>
      <circle cx="8" cy="5.5" r="3" />
      <path d="M2 14.5c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  </div>
);

const SkillDots = ({ color, count = 5, filled = 3 }: { color: string; count?: number; filled?: number }) => (
  <div className="flex gap-[2px]">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-full" style={{ width: 4, height: 4, background: color, opacity: i < filled ? 0.8 : 0.15 }} />
    ))}
  </div>
);

const SkillBar = ({ color, pct = 70 }: { color: string; pct?: number }) => (
  <div className="rounded-full overflow-hidden" style={{ height: 2.5, width: '100%', background: `${color}15` }}>
    <div className="rounded-full h-full" style={{ width: `${pct}%`, background: color, opacity: 0.6 }} />
  </div>
);

const ContactRow = ({ color }: { color: string }) => (
  <div className="flex items-center gap-[4px]">
    {[5, 4, 6].map((w, i) => (
      <div key={i} className="flex items-center gap-[2px]">
        <div className="rounded-full" style={{ width: 3, height: 3, background: color, opacity: 0.4 }} />
        <div className="rounded-full" style={{ height: 1.5, width: w * 2, background: color, opacity: 0.3 }} />
      </div>
    ))}
  </div>
);

export default function TemplateThumbnail({ templateId, primary, accent, headerBg }: ThumbnailProps) {
  const gray = '#d1d5db';
  const grayDark = '#9ca3af';

  /* â”€â”€â”€ 1 Â· Classique Pro â”€â”€â”€ */
  if (templateId === 1) return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="px-3 pt-3 pb-2" style={{ background: headerBg }}>
        <div className="flex items-center gap-2">
          <Avatar bg={`${accent}90`} size={20} />
          <div className="flex-1">
            <div className="rounded-sm" style={{ height: 3.5, width: '70%', background: '#fff', opacity: 0.9 }} />
            <div className="rounded-sm mt-[3px]" style={{ height: 2, width: '50%', background: '#fff', opacity: 0.5 }} />
          </div>
        </div>
        <div className="mt-2"><ContactRow color="#ffffff" /></div>
      </div>
      <div className="flex-1 flex gap-2 p-2">
        <div className="flex-1 space-y-1">
          <SectionLabel color={accent} width="45%" />
          <Lines color={gray} count={3} widths={['100%', '85%', '60%']} />
          <SectionLabel color={accent} width="50%" />
          <Lines color={gray} count={2} widths={['90%', '70%']} />
        </div>
        <div className="w-[35%] space-y-1">
          <SectionLabel color={accent} width="55%" />
          <SkillBar color={accent} pct={85} />
          <SkillBar color={accent} pct={60} />
          <SkillBar color={accent} pct={75} />
          <SectionLabel color={accent} width="50%" />
          <SkillDots color={accent} filled={4} />
          <SkillDots color={accent} filled={3} />
        </div>
      </div>
    </div>
  );

  /* â”€â”€â”€ 2 Â· Ingenieur â”€â”€â”€ */
  if (templateId === 2) return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="px-3 py-2 flex items-end justify-between" style={{ background: headerBg }}>
        <div>
          <div className="rounded-sm" style={{ height: 4, width: 45, background: '#fff', opacity: 0.9 }} />
          <div className="rounded-sm mt-[3px]" style={{ height: 2, width: 35, background: accent, opacity: 0.7 }} />
        </div>
        <div className="flex gap-[3px]">
          <div className="rounded-full" style={{ width: 5, height: 5, background: accent }} />
          <div className="rounded-full" style={{ width: 5, height: 5, background: accent }} />
        </div>
      </div>
      <div className="flex-1 flex p-2 gap-2">
        <div className="flex-[1.2] space-y-1">
          <SectionLabel color={accent} width="40%" />
          <div className="border-s-2 ps-1.5" style={{ borderColor: `${accent}50` }}>
            <Lines color={gray} count={3} widths={['100%', '80%', '55%']} />
          </div>
          <SectionLabel color={accent} width="45%" />
          <div className="border-s-2 ps-1.5" style={{ borderColor: `${accent}50` }}>
            <Lines color={gray} count={2} widths={['90%', '65%']} />
          </div>
        </div>
        <div className="w-[38%] space-y-1">
          <SectionLabel color={accent} width="50%" />
          <Lines color={gray} count={2} widths={['85%', '70%']} />
          <SectionLabel color={accent} width="55%" />
          <SkillDots color={accent} filled={4} />
          <SkillDots color={accent} filled={3} />
          <SkillDots color={accent} filled={5} />
        </div>
      </div>
    </div>
  );


  /* â”€â”€â”€ 3 Â· Executif (sidebar) â”€â”€â”€ */
  if (templateId === 3) return (
    <div className="h-full w-full bg-white flex">
      {/* Dark sidebar */}
      <div className="w-[32%] flex flex-col gap-[6px] p-2" style={{ background: headerBg || primary }}>
        <div className="mx-auto rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: accent, border: '1.5px solid rgba(255,255,255,0.2)' }}>
          <div className="rounded-full" style={{ width: 5, height: 5, background: '#fff', opacity: 0.7 }} />
        </div>
        <div className="space-y-[2px]">
          {[16, 14, 18, 12].map((w, i) => (
            <div key={i} className="flex items-center gap-[2px]">
              <div className="rounded-full" style={{ width: 2.5, height: 2.5, background: '#fff', opacity: 0.3 }} />
              <div className="rounded-sm" style={{ height: 1.5, width: w, background: '#fff', opacity: 0.25 }} />
            </div>
          ))}
        </div>
        <div className="rounded-sm" style={{ height: 2, width: '50%', background: accent, opacity: 0.7 }} />
        <div className="flex flex-wrap gap-[2px]">
          {[14, 12, 16, 10, 13].map((w, i) => (
            <div key={i} className="rounded-sm" style={{ height: 4, width: w, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)' }} />
          ))}
        </div>
        <div className="rounded-sm" style={{ height: 2, width: '45%', background: accent, opacity: 0.7 }} />
        <SkillDots color="#fff" filled={4} />
        <SkillDots color="#fff" filled={3} />
      </div>
      {/* Main content */}
      <div className="flex-1 p-2.5 space-y-1">
        <div className="rounded-sm" style={{ height: 4.5, width: '70%', background: primary, opacity: 0.9 }} />
        <div className="rounded-sm" style={{ height: 2, width: '50%', background: accent, opacity: 0.6 }} />
        <Lines color={gray} count={2} widths={['100%', '75%']} />
        <div className="h-[2px] mt-1" style={{ background: accent, opacity: 0.3 }} />
        <SectionLabel color={primary} width="40%" />
        <Lines color={gray} count={3} widths={['100%', '85%', '55%']} />
        <SectionLabel color={primary} width="45%" />
        <Lines color={gray} count={2} widths={['90%', '70%']} />
      </div>
    </div>
  );

  /* â”€â”€â”€ 4 Â· Medical â”€â”€â”€ */
  if (templateId === 4) return (
    <div className="h-full w-full bg-white flex flex-col">
      <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${primary}, ${accent})` }} />
      <div className="px-3 pt-2 pb-1 text-center">
        <div className="mx-auto rounded-full mb-[4px]" style={{ width: 20, height: 20, background: `${primary}15`, border: `1.5px solid ${accent}40` }}>
          <Avatar bg="transparent" size={20} text={accent} />
        </div>
        <div className="rounded-sm mx-auto" style={{ height: 3, width: '55%', background: primary, opacity: 0.8 }} />
        <div className="rounded-sm mx-auto mt-[2px]" style={{ height: 1.5, width: '40%', background: grayDark, opacity: 0.5 }} />
        <div className="flex justify-center gap-[6px] mt-[4px]">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-sm" style={{ width: 14, height: 5, background: `${accent}12` }} />
          ))}
        </div>
      </div>
      <div className="flex-1 px-3 pb-2 space-y-1">
        <SectionLabel color={accent} width="35%" />
        <Lines color={gray} count={3} widths={['100%', '90%', '65%']} />
        <SectionLabel color={accent} width="40%" />
        <Lines color={gray} count={2} widths={['85%', '70%']} />
      </div>
    </div>
  );

  /* â”€â”€â”€ 5 Â· Tech & IT (dark) â”€â”€â”€ */
  if (templateId === 5) return (
    <div className="h-full w-full flex flex-col" style={{ background: '#0D1117' }}>
      <div className="px-3 py-2 flex items-center gap-2" style={{ background: '#161B22' }}>
        <div className="flex gap-[3px]">
          <div className="rounded-full" style={{ width: 4, height: 4, background: '#f85149' }} />
          <div className="rounded-full" style={{ width: 4, height: 4, background: '#d29922' }} />
          <div className="rounded-full" style={{ width: 4, height: 4, background: '#3fb950' }} />
        </div>
        <div className="rounded-sm" style={{ height: 2, width: '40%', background: accent, opacity: 0.4 }} />
      </div>
      <div className="flex-1 flex p-2 gap-2">
        <div className="flex-1 space-y-1">
          <div className="rounded-sm" style={{ height: 3.5, width: '60%', background: accent, opacity: 0.7 }} />
          <div className="rounded-sm" style={{ height: 2, width: '45%', background: '#8b949e', opacity: 0.5 }} />
          <div className="mt-1"><SectionLabel color={accent} width="30%" /></div>
          <Lines color="#21262d" count={3} widths={['100%', '80%', '55%']} />
          <SectionLabel color={accent} width="35%" />
          <Lines color="#21262d" count={2} widths={['90%', '60%']} />
        </div>
        <div className="w-[35%] space-y-1">
          <SectionLabel color={accent} width="50%" />
          <SkillBar color={accent} pct={90} />
          <SkillBar color={accent} pct={70} />
          <SkillBar color={accent} pct={80} />
          <SkillBar color={accent} pct={55} />
          <SectionLabel color={accent} width="45%" />
          <Lines color="#21262d" count={2} widths={['80%', '65%']} />
        </div>
      </div>
    </div>
  );


  /* Fallback */
  return (
    <div className="h-full w-full bg-white flex items-center justify-center">
      <div className="rounded-sm" style={{ height: 4, width: '50%', background: primary, opacity: 0.5 }} />
    </div>
  );
}

