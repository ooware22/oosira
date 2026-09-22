/**
 * Optional CV photo. It is supplied per render (preview or PDF export) and is
 * never part of the saved CV data — see lib/cvPhoto.ts. Fixed dimensions come
 * from CSS so pagination measures the same height before and after decode.
 */
export function CVPhoto({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- local data URL printed into the PDF, not a hosted asset
  return <img src={src} alt="" className="cv-photo" />;
}
