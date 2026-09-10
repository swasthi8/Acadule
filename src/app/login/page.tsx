"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const form = new FormData(event.currentTarget);

    try {
      const result = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setError("The email or password is incorrect.");
        return;
      }

      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();

      const destination =
        session?.user?.role === "ADMIN"
          ? "/admin"
          : session?.user?.role === "TEACHER"
          ? "/teacher"
          : "/student";

      router.push(destination);
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] px-6 py-10 text-[#1f2937]">

      {/* Top navigation */}
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <BrandLogo />
        </Link>

        <Link
          href="/"
          className="text-sm font-medium text-gray-500 transition hover:text-[#198754]"
        >
          Back to home
        </Link>
      </header>

      {/* Login area */}
      <div className="mx-auto flex max-w-6xl items-center justify-center py-14 sm:py-20">

        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:grid-cols-2">

          {/* Left information panel */}
          <div className="hidden bg-[#eef8f1] p-10 md:block">

            <BrandLogo compact className="rounded-xl bg-white p-1 shadow-sm" />

            <h2 className="mt-8 text-3xl font-bold leading-tight text-[#176b43]">
              Welcome to Acadule
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Manage academic schedules, classes, teachers and
              timetables from one simple platform.
            </p>

            <div className="mt-8 space-y-4">

              <InfoItem text="Organized academic timetables" />

              <InfoItem text="Role-based access for users" />

              <InfoItem text="Easy schedule management" />

            </div>

          </div>

          {/* Login form */}
          <div className="p-7 sm:p-10">

            <div className="mb-8">
              <p className="text-sm font-semibold text-[#198754]">
                Secure Login
              </p>

              <h1 className="mt-2 text-3xl font-bold text-[#1f2937]">
                Welcome back
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Sign in to access your Acadule workspace.
              </p>
            </div>

            <form
              className="grid gap-5"
              onSubmit={submit}
            >

              {/* Email */}
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Email

                <input
                  className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/10"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@acadule.test"
                  required
                />
              </label>

              {/* Password */}
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Password

                <input
                  className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/10"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
              </label>

              {/* Error */}
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Login button */}
              <button
                className="mt-2 rounded-lg bg-[#198754] px-4 py-3 font-semibold text-white transition hover:bg-[#146c43] disabled:cursor-wait disabled:opacity-60"
                type="submit"
                disabled={busy}
              >
                {busy ? "Signing in..." : "Sign in"}
              </button>

            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              Your access is protected by role-based authentication.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}

/* Small information item */

function InfoItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">

      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-[#198754] shadow-sm">
        ✓
      </span>

      <span className="text-sm text-gray-600">
        {text}
      </span>

    </div>
  );
}