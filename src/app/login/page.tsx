"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("The email or password is incorrect.");
      setBusy(false);
      return;
    }

    const sessionResponse = await fetch("/api/auth/session");
    const session = await sessionResponse.json();
    const destination = session?.user?.role === "ADMIN" ? "/admin" : session?.user?.role === "TEACHER" ? "/teacher" : "/student";
    router.push(destination);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
          Acadule
        </Link>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <p className="text-sm text-slate-500">Secure workspace access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Sign in to manage your academic timetable.</p>
          <form className="mt-8 grid gap-5" onSubmit={submit}>
            <label className="grid gap-2 text-sm text-slate-300">
              Email
              <input className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300" name="email" type="email" autoComplete="email" placeholder="admin@acadule.test" required />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Password
              <input className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
            </label>
            {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">{error}</p>}
            <button className="rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
        <Link href="/" className="mt-6 block text-center text-sm text-slate-500 transition hover:text-slate-200">Back to homepage</Link>
      </div>
    </main>
  );
}
