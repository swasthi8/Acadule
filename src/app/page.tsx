import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-[#1f2937]">

      {/* =========================
          NAVIGATION BAR
      ========================== */}
      <header className="border-b border-[#dcebe1] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">

          <Link href="/" aria-label="Trinovi home">
            <BrandLogo />
          </Link>

          <Link
            href="/login"
            className="rounded-md bg-[#198754] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#146c43]"
          >
            Login
          </Link>

        </div>
      </header>


      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="border-b border-[#dcebe1] bg-white">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">

          {/* LEFT SIDE */}
          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[#cfe8d7] bg-[#f1f9f4] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#176b43]">
              <span className="h-2 w-2 rounded-full bg-[#198754]" />
              Academic Management System
            </div>


            <h1 className="max-w-2xl font-serif text-4xl font-bold leading-[1.08] tracking-tight text-[#1f2937] sm:text-5xl lg:text-6xl">
              Plan your academic schedule with confidence.
            </h1>


            <p className="mt-6 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
              Acadule helps colleges organize classes, teachers, rooms,
              availability, and timetables in one simple platform.
            </p>


            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="/login"
                className="rounded-md bg-[#198754] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#146c43]"
              >
                Get Started
              </Link>


              <a
                href="#features"
                className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#198754] hover:bg-[#f1f9f4] hover:text-[#176b43]"
              >
                Learn More
              </a>

            </div>

          </div>


          {/* RIGHT SIDE - CALENDAR PREVIEW */}
          <div className="rounded-xl border border-[#cfe8d7] bg-[#f7fbf8] p-4 shadow-[0_18px_45px_rgba(23,107,67,0.10)] sm:p-6">

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">

              {/* Calendar header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                <div>

                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#198754]">
                    Planning calendar
                  </p>

                  <h2 className="mt-1 font-semibold text-gray-800">
                    September 2026
                  </h2>

                </div>


                <div className="rounded-md bg-[#e8f5ec] px-3 py-2 text-xs font-semibold text-[#176b43]">
                  Month view
                </div>

              </div>


              {/* Month grid */}
              <div className="p-5">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:gap-2 sm:text-xs">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-2">
                  {[null, null, ...Array.from({ length: 30 }, (_, index) => index + 1)].map((day, index) => (
                    <div className={`flex aspect-square items-center justify-center rounded-lg text-xs sm:text-sm ${day === 9 ? 'bg-[#198754] font-semibold text-white' : day ? 'text-gray-700 hover:bg-[#f1f9f4]' : ''}`} key={day ?? `empty-${index}`}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#198754]" />
                  Current planning day
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =========================
          FEATURES SECTION
      ========================== */}
      <section
        id="features"
        className="bg-[#f7faf8] px-6 py-24"
      >

        <div className="mx-auto max-w-6xl">

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-wider text-[#198754]">
              What Acadule provides
            </p>

            <h2 className="mt-2 font-serif text-3xl font-bold text-[#1f2937] sm:text-4xl">
              Everything needed to manage academic schedules.
            </h2>

            <p className="mt-4 text-gray-600">
              Designed to make timetable planning and academic coordination
              easier for administrators, teachers, and students.
            </p>

          </div>


          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <Feature
              number="01"
              title="Smart Timetables"
              description="Create organized schedules while considering teachers, rooms, sections, and available periods."
            />


            <Feature
              number="02"
              title="Role-Based Access"
              description="Give administrators, teachers, and students access to the information they need."
            />


            <Feature
              number="03"
              title="Easy Management"
              description="Keep academic information organized in one place and make everyday coordination simpler."
            />

          </div>

        </div>

      </section>


      {/* =========================
          SIMPLE WORKFLOW
      ========================== */}
      <section className="border-t border-[#dcebe1] bg-white px-6 py-24">

        <div className="mx-auto max-w-6xl">

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-[#198754]">
              Simple workflow
            </p>

            <h2 className="mt-2 font-serif text-3xl font-bold text-[#1f2937] sm:text-4xl">
              Manage academics in three steps.
            </h2>

          </div>


          <div className="mt-14 grid gap-10 md:grid-cols-3">

            <Step
              number="1"
              title="Set up"
              description="Administrators configure teachers, subjects, rooms, sections and working periods."
            />

            <Step
              number="2"
              title="Create"
              description="Build and organize timetables based on the available academic resources."
            />

            <Step
              number="3"
              title="Publish"
              description="Teachers and students can access their schedules through their respective portals."
            />

          </div>

        </div>

      </section>


      {/* =========================
          CALL TO ACTION
      ========================== */}
      <section className="bg-[#176b43] px-6 py-14">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">

          <div>

            <h2 className="text-3xl font-bold text-white">
              Ready to manage your academic schedule?
            </h2>

            <p className="mt-2 text-sm text-green-100">
              Sign in to access your Acadule workspace.
            </p>

          </div>


          <Link
            href="/login"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#176b43] transition hover:bg-green-50"
          >
            Go to Login
          </Link>

        </div>

      </section>


      {/* =========================
          FOOTER
      ========================== */}
      <footer className="border-t border-[#dcebe1] bg-white px-6 py-6">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">

          <BrandLogo />

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Acadule. Academic Scheduling & Management.
          </p>

        </div>

      </footer>

    </main>
  );
}


/* ==================================================
   FEATURE CARD
   ================================================== */

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-[#dcebe1] bg-white p-6 shadow-[0_8px_24px_rgba(23,107,67,0.05)] transition hover:-translate-y-0.5 hover:border-[#b7dcc4] hover:shadow-md">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8f5ec] text-sm font-bold text-[#198754]">
          ✓
        </div>

        <span className="font-mono text-xs font-medium tracking-wider text-gray-400">
          {number}
        </span>

      </div>


      <h3 className="mt-5 text-lg font-semibold text-gray-800">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-gray-600">
        {description}
      </p>

    </div>
  );
}


/* ==================================================
   WORKFLOW STEP
   ================================================== */

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f5ec] text-lg font-bold text-[#198754]">
        {number}
      </div>


      <h3 className="mt-5 text-lg font-semibold text-gray-800">
        {title}
      </h3>


      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
        {description}
      </p>

    </div>
  );
}