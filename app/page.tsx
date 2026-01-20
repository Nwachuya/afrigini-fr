import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-64px)]">
      
      {/* Left Column: Content */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white relative">
        
        {/* Tag */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
            Next-Gen Recruitment
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
          PRECISION <br/>
          TALENT <br/>
          <span className="text-blue-600">INTELLIGENCE.</span>
        </h1>

        {/* Subhead */}
        <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed">
          Provisioning high-fidelity candidate matching and deep-scan assessment for organizations globally. Professional recruitment matured for the digital age.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/register" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
            GET STARTED
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
          <Link href="/login" className="px-8 py-4 bg-white text-gray-900 font-bold rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-center uppercase tracking-wide text-sm flex items-center justify-center">
            Sign In
          </Link>
        </div>

        {/* Features Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900">Global Reach</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">Cross-jurisdiction talent harvesting from over 190 nations.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900">Secure Protocol</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">AES-256 encrypted data pipelines for absolute confidentiality.</p>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-8 md:left-16 lg:left-24 flex gap-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            <span>Verified Integrity</span>
            <span>24/7 Monitoring</span>
        </div>

      </div>

      {/* Right Column: Image & Overlay */}
      <div className="hidden lg:block w-1/2 relative bg-gray-900 overflow-hidden">
        {/* Background Image */}
        <img 
          src="https://images.pexels.com/photos/5439381/pexels-photo-5439381.jpeg?q=80&w=2072&auto=format&fit=crop" 
          alt="Abstract Technology" 
          className="absolute inset-0 w-full h-full object-cover opacity-95 mix-blend-overlay"
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/50 to-black/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>

        {/* Testimonial Card */}
        <div className="absolute bottom-16 right-16 max-w-md bg-blue-600/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-blue-500/50 text-white">
            <div className="flex items-center gap-2 mb-4 text-blue-200 text-xs font-bold uppercase tracking-widest">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Verified Result Artifact
            </div>
            <p className="text-lg font-medium leading-relaxed mb-6 italic">
                "The accuracy of Afrigini's talent simulation has transformed our vendor onboarding protocol. Precision is non-negotiable."
            </p>
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-400 flex items-center justify-center font-bold text-blue-900">
                    MA
                </div>
                <div>
                    <p className="font-bold text-sm">MARCUS AURELIUS</p>
                    <p className="text-xs text-blue-200 uppercase tracking-wide">Head of Operations, Global Capital</p>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}
