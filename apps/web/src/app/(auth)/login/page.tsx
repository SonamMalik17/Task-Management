import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-6 text-3xl font-bold">Sign in</h1>
      <LoginForm />
      <p className="mt-4 text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link className="text-indigo-300 hover:underline" href="/register">
          Create one
        </Link>
      </p>
    </main>
  );
}
