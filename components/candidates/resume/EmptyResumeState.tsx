import Link from 'next/link';

export default function EmptyResumeState() {
  return (
    <section className="rounded-[28px] border border-dashed border-brand-green/30 bg-white p-8 text-center shadow-sm sm:p-12">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-green">Candidate Preview</p>
      <h1 className="mt-3 text-3xl font-bold text-brand-dark">Your preview is still empty</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600">
        This page is meant to show the read-only version of your candidate profile. Add your headline, bio, experience,
        skills, and resume details in your profile first.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/candidates/my-profile"
          className="inline-flex items-center justify-center rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-green-800"
        >
          Complete My Profile
        </Link>
        <Link
          href="/candidates/settings"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Account Settings
        </Link>
      </div>
    </section>
  );
}
