import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400 w-full mt-auto border-t border-gray-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-center text-sm">
        <div className="mb-4 md:mb-0">
          <p>&copy; {currentYear} Afrigini. All rights reserved.</p>
        </div>
        <nav className="flex space-x-8">
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
