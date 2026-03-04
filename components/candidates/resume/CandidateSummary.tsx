import type { CandidateProfileRecord } from '@/types';

export default function CandidateSummary({
  profile,
  preferences,
}: {
  profile: CandidateProfileRecord;
  preferences: string[];
}) {
  return (
    <section className="rounded-[24px] border border-brand-green/10 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Professional Summary</h2>
          <p className="mt-1 text-sm text-gray-500">This is the recruiter-facing overview of your profile.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {profile.bio || 'Add a bio in your profile so recruiters can quickly understand your background and strengths.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">Links</h3>
            <div className="mt-3 space-y-3 text-sm">
              <a
                href={profile.linkedin || undefined}
                target="_blank"
                rel="noreferrer"
                className={`block rounded-xl border px-4 py-3 transition-colors ${
                  profile.linkedin
                    ? 'border-brand-green/20 text-brand-green hover:bg-green-50'
                    : 'cursor-not-allowed border-gray-200 text-gray-400'
                }`}
              >
                LinkedIn
              </a>
              <a
                href={profile.portfolio || undefined}
                target="_blank"
                rel="noreferrer"
                className={`block rounded-xl border px-4 py-3 transition-colors ${
                  profile.portfolio
                    ? 'border-brand-green/20 text-brand-green hover:bg-green-50'
                    : 'cursor-not-allowed border-gray-200 text-gray-400'
                }`}
              >
                Portfolio
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">Preferences</h3>
            {preferences.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {preferences.map((item) => (
                  <span key={item} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">No work preferences listed.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
