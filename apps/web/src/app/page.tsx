import Link from 'next/link';

// Marketing-ish landing page. Server component — no client interactivity here.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <h1 className="text-5xl font-bold tracking-tight">AI Task Manager</h1>
      <p className="text-lg text-slate-400">
        Kanban boards, real-time collaboration, and an AI that drafts tasks from a sentence,
        summarizes work, and suggests what to do next.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium hover:bg-indigo-500"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium hover:bg-white/5"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
