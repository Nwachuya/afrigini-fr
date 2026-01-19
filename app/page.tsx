import Link from 'next/link';
export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 w-full">
      <h1 className="text-5xl font-bold mb-6 text-gray-900">Welcome to Afrigini</h1>
      <p className="text-xl mb-10 text-gray-600">Your premier platform for jobs and talent.</p>
      <div className="space-x-4">
        <Link href="/login" className="px-8 py-4 bg-blue-600 text-white rounded-md shadow-lg">Login</Link>
        <Link href="/register" className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-md shadow-md">Register</Link>
      </div>
    </div>
  );
}
