"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";

type Period = {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
};

type WorkingDay = {
  id: string;
  day: string;
  enabled: boolean;
};

type Entry = {
  id: string;
  subject: string;
  sectionId: string;
  section: string;
  className: string;
  room: string;
  day: string;
  periodId: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
};

type Props = {
  name: string;
  email: string;
  isAvailable: boolean;
  periods: Period[];
  workingDays: WorkingDay[];
  entries: Entry[];
};

const dayNames = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function TeacherPortal({
  name,
  email,
  isAvailable: initialAvailability,
  periods,
  workingDays,
  entries,
}: Props) {
  const [isAvailable, setIsAvailable] = useState(initialAvailability);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");

  const visibleEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (sectionFilter === "ALL" || entry.sectionId === sectionFilter) &&
          (subjectFilter === "ALL" || entry.subject === subjectFilter)
      ),
    [entries, sectionFilter, subjectFilter]
  );

  const sections = [
    ...new Map(entries.map((entry) => [entry.sectionId, entry.section]))
      .entries(),
  ];

  const subjects = [
    ...new Set(entries.map((entry) => entry.subject)),
  ].sort();

  const configuredDays = new Set(
    workingDays.map((day) => day.day)
  );

  const days = workingDays.length
    ? dayNames.filter((day) => configuredDays.has(day))
    : dayNames;

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  })
    .format(new Date())
    .toUpperCase();

  const todayEntries = visibleEntries
    .filter((entry) => entry.day === today)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  const upcoming =
    todayEntries.find(
      (entry) => toMinutes(entry.startTime) > currentMinutes()
    ) ?? todayEntries[0];

  return (
    <main className="portal-theme min-h-screen bg-[#f6faf7] px-4 py-6 text-[#1f2937] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}
        <Header name={name} email={email} isAvailable={isAvailable} availabilityBusy={availabilityBusy} onAvailabilityChange={async () => {
          const nextAvailability = !isAvailable;
          setAvailabilityBusy(true);
          try {
            const response = await fetch("/api/teacher/availability", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable: nextAvailability }) });
            if (!response.ok) throw new Error("Unable to update availability");
            setIsAvailable(nextAvailability);
          } finally {
            setAvailabilityBusy(false);
          }
        }} />

        {/* STAT CARDS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Weekly periods"
            value={entries.length}
          />

          <Stat
            label="Sections taught"
            value={
              new Set(entries.map((entry) => entry.sectionId)).size
            }
          />

          <Stat
            label="Subjects taught"
            value={
              new Set(entries.map((entry) => entry.subject)).size
            }
          />
        </section>

        {!entries.length ? (
          <EmptyState />
        ) : (
          <>
            <Upcoming
              entry={upcoming}
              today={today}
            />

            <Filters
              sections={sections}
              subjects={subjects}
              sectionFilter={sectionFilter}
              subjectFilter={subjectFilter}
              setSectionFilter={setSectionFilter}
              setSubjectFilter={setSubjectFilter}
            />

            <WeeklyGrid
              days={days}
              periods={periods}
              entries={visibleEntries}
            />

            <TodayClasses
              today={today}
              entries={todayEntries}
              upcoming={upcoming}
            />
          </>
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------- */
/* HEADER */
/* -------------------------------------------------- */

function Header({
  name,
  email,
  isAvailable,
  availabilityBusy,
  onAvailabilityChange,
}: {
  name: string;
  email: string;
  isAvailable: boolean;
  availabilityBusy: boolean;
  onAvailabilityChange: () => Promise<void>;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-5 border-b border-gray-200 bg-white px-5 py-5 shadow-sm sm:rounded-xl">

      <div>
        <div className="flex items-center gap-3">
          <div>
            <BrandLogo />

            <h1 className="mt-0.5 text-2xl font-semibold text-[#1f2937]">
              Teacher Portal
            </h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Welcome,{" "}
          <span className="font-medium text-gray-700">
            {name}
          </span>

          {email && (
            <>
              {" · "}
              {email}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isAvailable}
          aria-label="Set teacher availability"
          className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${isAvailable ? "border-[#b7dcc4] bg-[#f1f9f4] text-[#176b43] hover:bg-[#e8f5ec]" : "border-gray-300 bg-white text-gray-500 hover:border-[#198754] hover:bg-[#f0f8f3] hover:text-[#198754]"}`}
          onClick={onAvailabilityChange}
          disabled={availabilityBusy}
        >
          <span>Availability</span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${isAvailable ? "bg-[#198754]" : "bg-gray-300"}`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isAvailable ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </span>
          <span className="w-7 text-left text-xs font-semibold uppercase tracking-wide">
            {isAvailable ? "On" : "Off"}
          </span>
        </button>
        <button
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-[#198754] hover:bg-[#f0f8f3] hover:text-[#198754]"
          onClick={() =>
          signOut({
            callbackUrl: "/",
          })
          }
        >
          Log out
        </button>
      </div>
    </header>
  );
}

/* -------------------------------------------------- */
/* UPCOMING CLASS */
/* -------------------------------------------------- */

function Upcoming({
  entry,
  today,
}: {
  entry?: Entry;
  today: string;
}) {
  return (
    <section className="mt-6 rounded-xl border border-[#cfe8d7] bg-white p-5 shadow-sm">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#198754]" />

            <p className="text-xs font-semibold uppercase tracking-wider text-[#198754]">
              Upcoming Class
            </p>
          </div>

          {entry ? (
            <>
              <h2 className="mt-3 text-xl font-semibold text-[#1f2937]">
                {entry.subject}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Section {entry.section} · {entry.room} ·{" "}
                {entry.startTime}–{entry.endTime}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              No more classes scheduled for today.
            </p>
          )}
        </div>

        {entry && (
          <span className="rounded-md bg-[#e8f5ec] px-3 py-2 text-xs font-semibold text-[#198754]">
            {entry.day === today ? "Today" : entry.day}
          </span>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* FILTERS */
/* -------------------------------------------------- */

function Filters({
  sections,
  subjects,
  sectionFilter,
  subjectFilter,
  setSectionFilter,
  setSubjectFilter,
}: {
  sections: [string, string][];
  subjects: string[];
  sectionFilter: string;
  subjectFilter: string;
  setSectionFilter: (value: string) => void;
  setSubjectFilter: (value: string) => void;
}) {
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="mb-4">
        <h2 className="font-semibold text-gray-800">
          Filter Timetable
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select a section or subject to view specific classes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Section

          <select
            value={sectionFilter}
            onChange={(event) =>
              setSectionFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 outline-none transition focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/10"
          >
            <option value="ALL">
              All Sections
            </option>

            {sections.map(([id, label]) => (
              <option value={id} key={id}>
                Section {label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Subject

          <select
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(event.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-700 outline-none transition focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/10"
          >
            <option value="ALL">
              All Subjects
            </option>

            {subjects.map((subject) => (
              <option value={subject} key={subject}>
                {subject}
              </option>
            ))}
          </select>
        </label>

      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* WEEKLY GRID */
/* -------------------------------------------------- */

function WeeklyGrid({
  days,
  periods,
  entries,
}: {
  days: string[];
  periods: Period[];
  entries: Entry[];
}) {
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#198754]">
            Published Schedule
          </p>

          <h2 className="mt-1 text-xl font-semibold text-gray-800">
            Weekly Timetable
          </h2>
        </div>

        <p className="text-sm text-gray-500">
          {entries.length} classes shown
        </p>
      </div>

      <div className="overflow-x-auto">

        <div className="grid min-w-[900px] grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">

          <div className="bg-[#f8faf9] p-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Period
          </div>

          {days.map((day) => (
            <div
              className="bg-[#eaf5ee] p-3 text-xs font-semibold uppercase tracking-wider text-[#176b43]"
              key={day}
            >
              {day.slice(0, 3)}
            </div>
          ))}

          {periods.flatMap((period) => [
            <div
              className="bg-[#f8faf9] p-3 font-mono text-sm font-medium text-gray-500"
              key={`period-${period.id}`}
            >
              P{period.periodNumber}
            </div>,

            ...days.map((day) => (
              <TimetableCell
                day={day}
                period={period}
                entries={entries}
                key={`${day}-${period.id}`}
              />
            )),
          ])}

        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* TIMETABLE CELL */
/* -------------------------------------------------- */

function TimetableCell({
  day,
  period,
  entries,
}: {
  day: string;
  period: Period;
  entries: Entry[];
}) {
  const entry = entries.find(
    (item) =>
      item.day === day &&
      item.periodId === period.id
  );

  return (
    <div className="min-h-32 bg-white p-3 transition hover:bg-[#f8fcf9]">

      {entry ? (
        <>
          <p className="font-semibold text-gray-800">
            {entry.subject}
          </p>

          <p className="mt-2 inline-block rounded-md bg-[#e8f5ec] px-2 py-1 text-xs font-medium text-[#198754]">
            Section {entry.section}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {entry.room}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {entry.className}
          </p>
        </>
      ) : (
        <span className="text-xs text-gray-400">
          Open
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* TODAY'S CLASSES */
/* -------------------------------------------------- */

function TodayClasses({
  today,
  entries,
  upcoming,
}: {
  today: string;
  entries: Entry[];
  upcoming?: Entry;
}) {
  const label =
    today === "SUNDAY"
      ? "Today"
      : today.slice(0, 1) +
        today.slice(1).toLowerCase();

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      <p className="text-xs font-semibold uppercase tracking-wider text-[#198754]">
        {label} · {entries.length} classes
      </p>

      <h2 className="mt-1 text-xl font-semibold text-gray-800">
        Today&apos;s Classes
      </h2>

      <div className="mt-5 grid gap-3">

        {entries.length ? (
          entries.map((entry) => (
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition ${
                upcoming?.id === entry.id
                  ? "border-[#8ac9a2] bg-[#f0f8f3]"
                  : "border-gray-200 bg-white hover:border-[#b7dcc4]"
              }`}
              key={entry.id}
            >
              <div>
                <p className="font-semibold text-gray-800">
                  {entry.subject}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Section {entry.section} · {entry.room}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-sm font-medium text-[#198754]">
                  P{entry.periodNumber}
                </span>

                <p className="mt-1 text-xs text-gray-500">
                  {entry.startTime} – {entry.endTime}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
            No classes scheduled for today.
          </p>
        )}

      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------- */

function toMinutes(time: string) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function currentMinutes() {
  const now = new Date();

  return (
    now.getHours() * 60 +
    now.getMinutes()
  );
}

/* -------------------------------------------------- */
/* STAT CARD */
/* -------------------------------------------------- */

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#b7dcc4]">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-gray-500">
          {label}
        </p>

        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f5ec] text-[#198754]">
          ✓
        </span>

      </div>

      <p className="mt-4 text-3xl font-semibold text-[#176b43]">
        {value}
      </p>

    </div>
  );
}

/* -------------------------------------------------- */
/* EMPTY STATE */
/* -------------------------------------------------- */

function EmptyState() {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5ec] text-2xl text-[#198754]">
        📅
      </div>

      <h2 className="mt-4 text-xl font-semibold text-gray-800">
        No timetable has been published for you yet.
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Your published teaching schedule will appear here once it is ready.
      </p>

    </div>
  );
}