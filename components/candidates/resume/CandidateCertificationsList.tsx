import type { ResumeCertificationItem } from '@/lib/candidate-resume';
import { formatDisplayDate } from '@/lib/candidate-resume';

export default function CandidateCertificationsList({
  items,
}: {
  items: ResumeCertificationItem[];
}) {
  return (
    <section className="rounded-[24px] border border-brand-green/10 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-xl font-bold text-brand-dark">Certifications</h2>

      {items.length > 0 ? (
        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <article key={`${item.name || 'certification'}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-dark">{item.name || 'Certification not specified'}</h3>
                  <p className="text-sm text-gray-500">{item.issuer || 'Issuer not specified'}</p>
                </div>
                {item.issuedDate && (
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                    Issued {formatDisplayDate(item.issuedDate)}
                  </p>
                )}
              </div>

              {(item.credentialId || item.credentialUrl) && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  {item.credentialId && <span className="text-gray-500">Credential ID: {item.credentialId}</span>}
                  {item.credentialUrl && (
                    <a
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-green hover:text-green-800"
                    >
                      View credential
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No certifications listed.</p>
      )}
    </section>
  );
}
