"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type Period = { id: string; periodNumber: number; startTime: string; endTime: string };
type WorkingDay = { id: string; day: string; enabled: boolean };
type Entry = { id: string; subject: string; sectionId: string; section: string; className: string; room: string; day: string; periodId: string; periodNumber: number; startTime: string; endTime: string };
type Props = { name: string; email: string; periods: Period[]; workingDays: WorkingDay[]; entries: Entry[] };

const dayNames = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export function TeacherPortal({ name, email, periods, workingDays, entries }: Props) {
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const visibleEntries = useMemo(() => entries.filter((entry) => (sectionFilter === "ALL" || entry.sectionId === sectionFilter) && (subjectFilter === "ALL" || entry.subject === subjectFilter)), [entries, sectionFilter, subjectFilter]);
  const sections = [...new Map(entries.map((entry) => [entry.sectionId, entry.section])).entries()];
  const subjects = [...new Set(entries.map((entry) => entry.subject))].sort();
  const configuredDays = new Set(workingDays.map((day) => day.day));
  const days = workingDays.length ? dayNames.filter((day) => configuredDays.has(day)) : dayNames;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date()).toUpperCase();
  const todayEntries = visibleEntries.filter((entry) => entry.day === today).sort((a, b) => a.periodNumber - b.periodNumber);
  const upcoming = todayEntries.find((entry) => toMinutes(entry.startTime) > currentMinutes()) ?? todayEntries[0];

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <Header name={name} email={email} />
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Weekly periods" value={entries.length} />
          <Stat label="Sections taught" value={new Set(entries.map((entry) => entry.sectionId)).size} />
          <Stat label="Subjects taught" value={new Set(entries.map((entry) => entry.subject)).size} />
        </section>
        {!entries.length ? <EmptyState /> : <>
          <Upcoming entry={upcoming} today={today} />
          <Filters sections={sections} subjects={subjects} sectionFilter={sectionFilter} subjectFilter={subjectFilter} setSectionFilter={setSectionFilter} setSubjectFilter={setSubjectFilter} />
          <WeeklyGrid days={days} periods={periods} entries={visibleEntries} />
          <TodayClasses today={today} entries={todayEntries} upcoming={upcoming} />
        </>}
      </div>
    </main>
  );
}

function Header({ name, email }: { name: string; email: string }) {
  return <header className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-800 pb-6"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Acadule</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Teacher Portal</h1><p className="mt-2 text-slate-400">{name}{email ? ` · ${email}` : ""}</p></div><button className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-white" onClick={() => signOut({ callbackUrl: "/" })}>Log out</button></header>;
}

function Upcoming({ entry, today }: { entry?: Entry; today: string }) {
  return <section className="mt-8 grid gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Upcoming class</p>{entry ? <><h2 className="mt-2 text-xl font-semibold text-white">{entry.subject}</h2><p className="mt-1 text-sm text-slate-300">Section {entry.section} · {entry.room} · {entry.startTime}–{entry.endTime}</p></> : <p className="mt-2 text-sm text-slate-400">No more classes scheduled for today.</p>}</div>{entry && <span className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950">{entry.day === today ? "Today" : entry.day}</span>}</section>;
}

function Filters({ sections, subjects, sectionFilter, subjectFilter, setSectionFilter, setSubjectFilter }: { sections: [string, string][]; subjects: string[]; sectionFilter: string; subjectFilter: string; setSectionFilter: (value: string) => void; setSubjectFilter: (value: string) => void }) {
  return <section className="mt-8 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-2"><label className="grid gap-2 text-sm text-slate-300">Section<select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"><option value="ALL">All Sections</option>{sections.map(([id, label]) => <option value={id} key={id}>Section {label}</option>)}</select></label><label className="grid gap-2 text-sm text-slate-300">Subject<select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100"><option value="ALL">All Subjects</option>{subjects.map((subject) => <option value={subject} key={subject}>{subject}</option>)}</select></label></section>;
}

function WeeklyGrid({ days, periods, entries }: { days: string[]; periods: Period[]; entries: Entry[] }) {
  return <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Published schedule</p><h2 className="mt-1 text-xl font-semibold text-white">Weekly timetable</h2></div><p className="text-sm text-slate-500">{entries.length} classes shown</p></div><div className="overflow-x-auto"><div className="grid min-w-[900px] grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"><div className="bg-slate-950 p-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Period</div>{days.map((day) => <div className="bg-slate-950 p-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300" key={day}>{day.slice(0, 3)}</div>)}{periods.flatMap((period) => [<div className="bg-slate-950 p-3 font-mono text-sm text-slate-500" key={`period-${period.id}`}>P{period.periodNumber}</div>, ...days.map((day) => <TimetableCell day={day} period={period} entries={entries} key={`${day}-${period.id}`} />)])}</div></div></section>;
}

function TimetableCell({ day, period, entries }: { day: string; period: Period; entries: Entry[] }) {
  const entry = entries.find((item) => item.day === day && item.periodId === period.id);
  return <div className="min-h-32 bg-slate-900/80 p-3">{entry ? <><p className="font-medium text-white">{entry.subject}</p><p className="mt-2 text-xs text-cyan-200">Section {entry.section}</p><p className="mt-1 text-xs text-slate-300">{entry.room}</p><p className="mt-1 text-xs text-slate-600">{entry.className}</p></> : <span className="text-xs text-slate-700">Open</span>}</div>;
}

function TodayClasses({ today, entries, upcoming }: { today: string; entries: Entry[]; upcoming?: Entry }) {
  const label = today === "SUNDAY" ? "Today" : today.slice(0, 1) + today.slice(1).toLowerCase();
  return <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{label} · {entries.length} classes</p><h2 className="mt-1 text-xl font-semibold text-white">Today&apos;s Classes</h2><div className="mt-5 grid gap-3">{entries.length ? entries.map((entry) => <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${upcoming?.id === entry.id ? "border-cyan-300/50 bg-cyan-300/5" : "border-slate-800 bg-slate-950/30"}`} key={entry.id}><div><p className="font-medium text-white">{entry.subject}</p><p className="mt-1 text-sm text-slate-400">Section {entry.section} · {entry.room}</p></div><span className="font-mono text-sm text-cyan-200">P{entry.periodNumber} · {entry.startTime}</span></div>) : <p className="text-sm text-slate-500">No classes scheduled for today.</p>}</div></section>;
}

function toMinutes(time: string) { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; }
function currentMinutes() { const now = new Date(); return now.getHours() * 60 + now.getMinutes(); }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold text-cyan-300">{value}</p></div>; }
function EmptyState() { return <div className="mt-10 rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center"><h2 className="text-xl font-semibold text-white">No timetable has been published for you yet.</h2><p className="mt-2 text-sm text-slate-500">Your published teaching schedule will appear here once it is ready.</p></div>; }
