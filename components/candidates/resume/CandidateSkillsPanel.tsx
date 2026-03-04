export default function CandidateSkillsPanel({
  skills,
  languages,
}: {
  skills: string[];
  languages: string[];
}) {
  return (
    <section className="rounded-[24px] border border-brand-green/10 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="text-xl font-bold text-brand-dark">Skills and Languages</h2>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">Skills</h3>
          {skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No skills listed yet.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">Languages</h3>
          {languages.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {languages.map((language) => (
                <span key={language} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
                  {language}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No languages listed yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
