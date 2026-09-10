"use client";

import { signOut } from "next-auth/react";
import { BrandLogo } from "@/components/brand-logo";

type Period = { id: string; periodNumber: number; startTime: string; endTime: string };
type WorkingDay = { id: string; day: string; enabled: boolean };
type Entry = { id: string; subject: string; teacher: string; room: string; day: string; periodId: string; periodNumber: number; startTime: string; endTime: string };
type Props = { name: string; email: string; className: string; sectionName: string; periods: Period[]; workingDays: WorkingDay[]; entries: Entry[] };

const dayNames = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export function StudentPortal({ name, email, className, sectionName, periods, workingDays, entries }: Props) {
  const configuredDays = new Set(workingDays.map((day) => day.day));
  const days = workingDays.length ? dayNames.filter((day) => configuredDays.has(day)) : dayNames;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date()).toUpperCase();
  const todayEntries = entries.filter((entry) => entry.day === today).sort((a, b) => a.periodNumber - b.periodNumber);
  const upcoming = todayEntries.find((entry) => toMinutes(entry.startTime) > currentMinutes()) ?? todayEntries[0];
  const subjects = new Set(entries.map((entry) => entry.subject)).size;

  return <main className="portal-theme min-h-screen bg-[#07111f] px-4 py-6 text-slate-100 sm:px-6 lg:px-10"><div className="mx-auto max-w-[1500px]">
    <header className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-800 pb-6"><div><BrandLogo /><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Student Portal</h1><p className="mt-2 text-slate-400">{name}{email ? ` · ${email}` : ""}</p><p className="mt-1 text-sm text-slate-500">{className} · Section {sectionName}</p></div><button className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-white" onClick={() => signOut({ callbackUrl: "/" })}>Log out</button></header>
    {!entries.length ? <EmptyState sectionName={sectionName} /> : <><section className="mt-6 grid gap-3 sm:grid-cols-4"><Stat label="Weekly periods" value={entries.length} /><Stat label="Subjects this week" value={subjects} /><Stat label="Current section" value={`Section ${sectionName}`} /><Stat label="Current class" value={className} /></section><Upcoming entry={upcoming} today={today} /><WeeklyGrid days={days} periods={periods} entries={entries} /><TodayClasses today={today} entries={todayEntries} upcoming={upcoming} /></>}
  </div></main>;
}

function Upcoming({ entry, today }: { entry?: Entry; today: string }) { return <section className="mt-8 grid gap-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Upcoming class</p>{entry ? <><h2 className="mt-2 text-xl font-semibold text-white">{entry.subject}</h2><p className="mt-1 text-sm text-slate-300">{entry.teacher} · {entry.room} · {entry.startTime}–{entry.endTime}</p></> : <p className="mt-2 text-sm text-slate-400">No more classes scheduled for today.</p>}</div>{entry && <span className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950">{entry.day === today ? "Today" : entry.day}</span>}</section>; }

function WeeklyGrid({ days, periods, entries }: { days: string[]; periods: Period[]; entries: Entry[] }) { return <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Published schedule</p><h2 className="mt-1 text-xl font-semibold text-white">Weekly timetable</h2></div><p className="text-sm text-slate-500">Section-scoped view</p></div><div className="overflow-x-auto"><div className="grid min-w-[900px] grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"><div className="bg-slate-950 p-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Period</div>{days.map((day) => <div className="bg-slate-950 p-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300" key={day}>{day.slice(0, 3)}</div>)}{periods.map((period) => [<div className="bg-slate-950 p-3 font-mono text-sm text-slate-500" key={`period-${period.id}`}>P{period.periodNumber}</div>, ...days.map((day) => <Cell key={`${day}-${period.id}`} day={day} period={period} entries={entries} />)])}</div></div></section>; }

function Cell({ day, period, entries }: { day: string; period: Period; entries: Entry[] }) { const entry = entries.find((item) => item.day === day && item.periodId === period.id); return <div className="min-h-32 bg-slate-900/80 p-3">{entry ? <><p className="font-medium text-white">{entry.subject}</p><p className="mt-2 text-xs text-cyan-200">{entry.teacher}</p><p className="mt-1 text-xs text-slate-300">{entry.room}</p></> : <span className="text-xs text-slate-700">Open</span>}</div>; }

function TodayClasses({ today, entries, upcoming }: { today: string; entries: Entry[]; upcoming?: Entry }) { const label = today === "SUNDAY" ? "Today" : today.slice(0, 1) + today.slice(1).toLowerCase(); return <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{label} · {entries.length} classes</p><h2 className="mt-1 text-xl font-semibold text-white">Today&apos;s Classes</h2><div className="mt-5 grid gap-3">{entries.length ? entries.map((entry) => <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${upcoming?.id === entry.id ? "border-cyan-300/50 bg-cyan-300/5" : "border-slate-800 bg-slate-950/30"}`} key={entry.id}><div><p className="font-medium text-white">{entry.subject}</p><p className="mt-1 text-sm text-slate-400">{entry.teacher} · {entry.room}</p></div><span className="font-mono text-sm text-cyan-200">P{entry.periodNumber} · {entry.startTime}</span></div>) : <p className="text-sm text-slate-500">No classes scheduled for today.</p>}</div></section>; }

function toMinutes(time: string) { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; }
function currentMinutes() { const now = new Date(); return now.getHours() * 60 + now.getMinutes(); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 truncate text-xl font-semibold text-cyan-300">{value}</p></div>; }
function EmptyState({ sectionName }: { sectionName: string }) { return <div className="mt-10 rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center"><h2 className="text-xl font-semibold text-white">No timetable has been published for your section yet.</h2><p className="mt-2 text-sm text-slate-500">Your Section {sectionName} schedule will appear here once it is published.</p></div>; }
