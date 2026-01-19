import AuthForm from '@/components/AuthForm';
export default function RegisterPage() {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
      <AuthForm type="register" />
    </div>
  );
}
