import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-80px)]">
      
      {/* Left Column: Portal Entry */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-start p-8 md:p-16 lg:p-24 bg-white z-10">
        <div className="max-w-md w-full">
          <span className="text-brand-green font-bold tracking-widest uppercase text-xs mb-4 block">
            Portal Access
          </span>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-brand-dark tracking-tight mb-6">
            Welcome to <br/> Afrigini.
          </h1>
          
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            Your platform for jobs and talent. Log in to manage your profile, post opportunities, or track applications.
          </p>
          
          <div className="flex flex-col gap-4">
            <Link 
              href="/login" 
              className="w-full py-4 bg-brand-green text-white text-lg font-bold rounded-xl hover:bg-green-800 transition-all shadow-lg hover:shadow-green-900/20 text-center"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="w-full py-4 bg-white text-brand-dark border-2 border-gray-200 text-lg font-bold rounded-xl hover:border-brand-green hover:text-brand-green transition-all text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Image & Testimonial */}
      <div className="hidden lg:block w-1/2 relative bg-brand-dark overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1974&auto=format&fit=crop" 
          alt="African Tech Professional" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-90"></div>
        
        {/* Realistic Testimonial Card */}
        <div className="absolute bottom-16 left-16 right-16 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl text-white shadow-2xl">
          <div className="flex items-center gap-2 mb-4 text-green-300 text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Verified Success Story
          </div>
          <p className="text-xl font-medium leading-relaxed mb-6 font-serif italic">
            "We struggled to find senior developers in our time zone. Afrigini connected us with an incredible engineer from Lagos who integrated seamlessly with our London team within days."
          </p>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white text-brand-green flex items-center justify-center font-bold text-lg">
              SJ
            </div>
            <div>
              <p className="font-bold text-white">Sarah Jenkins</p>
              <p className="text-xs text-gray-300 uppercase tracking-wide">CTO, FinTech Global</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
