import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-24 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">Acadule</p>
          <Link href="/login" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
            Login
          </Link>
        </div>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">Academic scheduling, without the collision course.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          The foundation is ready for secure role-based access, availability-aware timetable generation, and validated publishing.
        </p>
      </div>
    </main>
  );
}
