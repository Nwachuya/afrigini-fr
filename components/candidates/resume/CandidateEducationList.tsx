import type { ResumeEducationItem } from '@/lib/candidate-resume';
import { formatTimelineDate } from '@/lib/candidate-resume';

export default function CandidateEducationList({
  items,
}: {
  items: ResumeEducationItem[];
}) {
  return (
    <section className="rounded-[24px] border border-brand-green/10 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-xl font-bold text-brand-dark">Education</h2>

      {items.length > 0 ? (
        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <article key={`${item.school || 'school'}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-dark">{item.school || 'School not specified'}</h3>
                  <p className="text-sm text-gray-500">
                    {item.degree || 'Degree not specified'}
                    {item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ''}
                  </p>
                </div>
                {(item.startDate || item.endDate) && (
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {formatTimelineDate(item.startDate)} - {item.isCurrent ? 'Present' : formatTimelineDate(item.endDate)}
                  </p>
                )}
              </div>
              {item.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">{item.description}</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No education listed.</p>
      )}
    </section>
  );
}
