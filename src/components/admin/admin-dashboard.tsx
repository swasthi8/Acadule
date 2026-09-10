"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { SectionKey } from "@/components/admin/admin-dashboard-types";

export type DashboardSummary = {
  latestTimetable: {
    version: number;
    status: string;
    scheduledEntries: number;
    requiredPeriods: number;
    updatedAt: string;
    validation: "PASS" | "CHECK" | "NOT_RUN";
  } | null;
  health: { label: string; status: "PASS" | "CHECK" | "NOT_RUN" }[];
  workload: { teacherId: string; teacherName: string; required: number; scheduled: number }[];
};

type Props = {
  counts: { label: string; value: number; accent: string }[];
  data: { assignments: { teacherId: string }[]; rooms: { id: string }[]; periods: { id: string }[] };
  summary: DashboardSummary;
  onNavigate: (key: SectionKey) => void;
};

const quickActions: { label: string; description: string; key: SectionKey; accent: string }[] = [
  { label: "Manage Teachers", description: "Staff and accounts", key: "teachers", accent: "text-cyan-300" },
  { label: "Manage Students", description: "Learners and sections", key: "students", accent: "text-amber-300" },
  { label: "Manage Subjects", description: "Curriculum requirements", key: "subjects", accent: "text-rose-300" },
  { label: "Manage Rooms", description: "Capacity and spaces", key: "rooms", accent: "text-sky-300" },
  { label: "Teacher Assignments", description: "Connect sections to staff", key: "assignments", accent: "text-violet-300" },
  { label: "Generate Timetable", description: "Create a conflict-free draft", key: "timetable", accent: "text-emerald-300" },
  { label: "Validate Timetable", description: "Check every hard constraint", key: "timetable", accent: "text-emerald-300" },
  { label: "Publish Timetable", description: "Make the schedule visible", key: "timetable", accent: "text-emerald-300" },
];

export function AdminDashboard({ counts, data, summary, onNavigate }: Props) {
  const latest = summary.latestTimetable;
  return <div className="grid gap-6">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{counts.map((card) => <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-500">{card.label}</p><p className="mt-4 text-4xl font-semibold !text-[#000000]">{card.value}</p><div className="mt-5 h-1 w-12 rounded-full bg-slate-700" /></div>)}</section>
    <section className="rounded-2xl border border-[#cfe8d7] bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Acadule intelligence</p><h2 className="mt-2 text-2xl font-semibold text-white">Automatically create, validate, and manage conflict-free schedules.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Your academic model, constraints, and published timetable stay visible in one control room.</p></div>{latest && <span className="text-sm font-medium text-gray-600">{latest.status}</span>}</div></section>
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Latest timetable</p><h2 className="mt-1 text-xl font-semibold text-white">{latest ? `Timetable v${latest.version}` : "No timetable yet"}</h2></div><button className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200" onClick={() => onNavigate("timetable")}>{latest ? "Open timetable" : "Get started"}</button></div>{latest ? <><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Scheduled" value={`${latest.scheduledEntries} / ${latest.requiredPeriods}`} /><Metric label="Validation" value={latest.validation} /><Metric label="Updated" value={<HydratedDate value={latest.updatedAt} />} /></div><p className="mt-5 text-sm text-emerald-300">{latest.validation === "PASS" ? "All constraints passed" : latest.validation === "NOT_RUN" ? "Validation has not been run" : "Review the validation report"}</p></> : <p className="mt-6 text-sm text-slate-500">Generate a draft timetable after setting up assignments, periods, rooms, and availability.</p>}</section>
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Admin actions</p><h2 className="mt-1 text-xl font-semibold text-white">Quick actions</h2></div><p className="text-xs text-slate-500">{data.assignments.length} assignments · {data.rooms.length} rooms · {data.periods.length} periods</p></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{quickActions.map((action) => <button key={action.label} onClick={() => onNavigate(action.key)} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-left transition hover:border-cyan-300/50"><span className={`block text-sm font-semibold ${action.accent}`}>{action.label}</span><span className="mt-1 block text-xs text-slate-500">{action.description}</span></button>)}</div></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 truncate text-sm font-semibold text-slate-100">{value}</p></div>; }
function HydratedDate({ value }: { value: string }) {
  const [formatted, setFormatted] = useState("—");
  useEffect(() => {
    setFormatted(new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }));
  }, [value]);
  return <>{formatted}</>;
}
