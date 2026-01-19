import AuthForm from '@/components/AuthForm';
export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <AuthForm type="login" />
    </div>
  );
}
