import Link from 'next/link';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-6 text-3xl font-bold">Create your account</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-slate-400">
        Already have one?{' '}
        <Link className="text-indigo-300 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
