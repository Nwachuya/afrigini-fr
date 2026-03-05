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

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {profile.bio || 'Add a bio in your profile so recruiters can quickly understand your background and strengths.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">Links</h3>
            <div className="mt-3 space-y-3 text-sm">
              {profile.linkedin ? (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-brand-green/20 px-4 py-3 transition-colors hover:bg-green-50"
                >
                  <p className="font-semibold text-brand-green">LinkedIn</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{profile.linkedin}</p>
                </a>
              ) : (
                <div className="rounded-xl border border-gray-200 px-4 py-3 text-gray-400">
                  <p className="font-semibold">LinkedIn</p>
                  <p className="mt-1 text-xs">Not provided</p>
                </div>
              )}

              {profile.portfolio ? (
                <a
                  href={profile.portfolio}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-brand-green/20 px-4 py-3 transition-colors hover:bg-green-50"
                >
                  <p className="font-semibold text-brand-green">Portfolio</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{profile.portfolio}</p>
                </a>
              ) : (
                <div className="rounded-xl border border-gray-200 px-4 py-3 text-gray-400">
                  <p className="font-semibold">Portfolio</p>
                  <p className="mt-1 text-xs">Not provided</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">Department Preferences</h3>
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
