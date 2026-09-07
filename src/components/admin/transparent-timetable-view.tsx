"use client";

import { useState } from "react";

type Section = { id: string; name: string; className: string };
type Period = { id: string; periodNumber: number; startTime: string; endTime: string };
type Requirement = { id: string; sectionId: string; sectionName: string; subjectName: string; requiredWeeklyPeriods: number; scheduled: number; status: string };
type Entry = { id: string; sectionId: string; subjectName: string; teacherName: string; teacherId: string; roomName: string; day: string; periodNumber: number };
type Workload = { teacherId: string; teacherName: string; required: number; scheduled: number };
type Conflict = { key: string; teacherName: string; day: string; periodNumber: number; sections: string[] };
type Timetable = { id: string; version: number; status: string; entries: number; updatedAt: string; timetableEntries: Entry[]; requirements: Requirement[]; workload: Workload[]; teacherConflicts: Conflict[] };

type Props = { sections: Section[]; periods: Period[]; timetables: Timetable[]; onDone: () => void; onNotify: (message: string) => void };

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error([body.error ?? "Something went wrong", ...(Array.isArray(body.conflicts) ? body.conflicts : [])].join("\n"));
  return body;
}

function ActionButton({ children, onClick, primary = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return <button className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${primary ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200" : "border border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-300"}`} onClick={onClick}>{children}</button>;
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-slate-950/20"><div className="mb-5">{eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>}<h2 className="mt-1 text-xl font-semibold text-white">{title}</h2></div>{children}</section>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="text-xs uppercase tracking-[0.14em] text-slate-600">{headers.map((header) => <th className="pb-3 pr-4 font-medium" key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function TransparentTimetableView({ sections, periods, timetables, onDone, onNotify }: Props) {
  const [selectedId, setSelectedId] = useState(timetables[0]?.id ?? "");
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id ?? "");
  const selected = timetables.find((item) => item.id === selectedId) ?? timetables[0];
  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0];
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const entries = selected?.timetableEntries.filter((entry) => entry.sectionId === selectedSection?.id) ?? [];
  const requirements = selected?.requirements.filter((item) => item.sectionId === selectedSection?.id) ?? [];
  const totalRequired = requirements.reduce((total, item) => total + item.requiredWeeklyPeriods, 0);
  const totalScheduled = requirements.reduce((total, item) => total + item.scheduled, 0);
  const allSectionsRequired = selected?.requirements.reduce((total, item) => total + item.requiredWeeklyPeriods, 0) ?? 0;
  const allSectionsScheduled = selected?.requirements.reduce((total, item) => total + item.scheduled, 0) ?? 0;

  async function generate() { try { await request("/api/admin/timetables", { method: "POST" }); onNotify("Conflict-free draft generated and saved"); onDone(); } catch (error) { onNotify(error instanceof Error ? error.message : "Unable to generate timetable"); } }
  async function validate() { if (!selected) return; try { await request(`/api/admin/timetables/${selected.id}/validate`, { method: "POST" }); onNotify("Timetable validated and ready for review"); onDone(); } catch (error) { onNotify(error instanceof Error ? error.message : "Timetable validation failed"); } }
  async function publish() { if (!selected) return; try { await request(`/api/admin/timetables/${selected.id}/publish`, { method: "POST" }); onNotify("Timetable published"); onDone(); } catch (error) { onNotify(error instanceof Error ? error.message : "Timetable must be validated before publishing"); } }
  async function deleteTimetable(item: Timetable) { const message = item.status === "PUBLISHED" ? `Delete published timetable v${item.version}?\nThis will permanently remove its scheduled entries.` : `Delete Timetable v${item.version}?\nThis will remove ${item.entries} scheduled entries.`; if (!window.confirm(message)) return; try { await request(`/api/admin/timetables/${item.id}`, { method: "DELETE" }); onNotify(`Timetable v${item.version} deleted`); onDone(); } catch (error) { onNotify(error instanceof Error ? error.message : "Unable to delete timetable"); } }

  return <div className="grid gap-6">
    <Panel title="Timetable workflow" eyebrow="Draft to publication"><div className="flex flex-wrap gap-2"><ActionButton primary onClick={generate}>Generate Timetable</ActionButton>{selected && <><ActionButton onClick={validate}>Validate</ActionButton><ActionButton onClick={publish}>Publish</ActionButton></>}</div></Panel>
    {selected && <>
      <Panel title={`Weekly grid · Draft v${selected.version}`} eyebrow={`${selected.entries} total scheduled entries`}>
        <div className="mb-5 flex flex-wrap items-center gap-2"><select aria-label="Select timetable" value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">{timetables.map((item) => <option value={item.id} key={item.id}>v{item.version} · {item.status}</option>)}</select><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300">{selected.status}</span><span className="text-xs text-slate-400">All sections: {allSectionsScheduled} / {allSectionsRequired} periods scheduled</span></div>
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Section timetables">{sections.map((section) => <button key={section.id} role="tab" aria-selected={selectedSection?.id === section.id} onClick={() => setSelectedSectionId(section.id)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${selectedSection?.id === section.id ? "bg-cyan-300 text-slate-950" : "border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-300"}`}>Section {section.name}</button>)}</div>
        <div className="overflow-x-auto"><div className="grid min-w-[900px] grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800"><div className="bg-slate-950 p-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Period</div>{days.map((day) => <div className="bg-slate-950 p-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300" key={day}>{day.slice(0, 3)}</div>)}{periods.map((period) => [<div className="bg-slate-950 p-3 font-mono text-sm text-slate-500" key={`period-${period.id}`}>P{period.periodNumber}</div>, ...days.map((day) => { const entry = entries.find((item) => item.day === day && item.periodNumber === period.periodNumber); return <div className="min-h-28 bg-slate-900/80 p-3" key={`${day}-${period.id}`}>{entry ? <><p className="font-medium text-white">{entry.subjectName}</p><p className="mt-2 text-xs text-cyan-200">{entry.teacherName}</p><p className="mt-1 text-xs font-medium text-slate-300">Section {selectedSection?.name}</p><p className="mt-1 text-xs text-slate-500">{entry.roomName}</p></> : <span className="text-xs text-slate-700">Open</span>}</div>; })])}</div></div>
      </Panel>
      <div className="grid gap-6 xl:grid-cols-2"><Panel title={`Section ${selectedSection?.name} subject requirements`} eyebrow={`${totalRequired} required · ${totalScheduled} scheduled`}><Table headers={["Subject", "Required", "Scheduled", "Status"]}>{requirements.map((item) => <tr className="border-t border-slate-800" key={item.id}><td className="py-3 font-medium text-white">{item.subjectName}</td><td className="py-3 text-slate-400">{item.requiredWeeklyPeriods}</td><td className="py-3 text-slate-400">{item.scheduled}</td><td className={`py-3 font-semibold ${item.status === "PASS" ? "text-emerald-300" : "text-amber-300"}`}>{item.status}</td></tr>)}</Table><div className="mt-4 flex justify-between border-t border-slate-800 pt-4 text-sm font-semibold text-slate-200"><span>Total required: {totalRequired}</span><span>Total scheduled: {totalScheduled}</span></div></Panel><Panel title="Teacher workload" eyebrow="Across Section A and Section B"><Table headers={["Teacher", "Required", "Scheduled"]}>{selected.workload.map((item) => <tr className="border-t border-slate-800" key={item.teacherId}><td className="py-3 font-medium text-white">{item.teacherName}</td><td className="py-3 text-slate-400">{item.required}</td><td className="py-3 text-slate-400">{item.scheduled}</td></tr>)}</Table></Panel></div>
      <Panel title="Shared teacher conflict report" eyebrow="Teacher + day + period"><div className={`rounded-xl border px-4 py-3 text-sm ${selected.teacherConflicts.length ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{selected.teacherConflicts.length ? `${selected.teacherConflicts.length} teacher collision(s) detected` : "PASS · No teacher appears in two sections at the same day and period."}</div>{selected.teacherConflicts.length > 0 && <Table headers={["Teacher", "Day", "Period", "Sections"]}>{selected.teacherConflicts.map((conflict) => <tr className="border-t border-slate-800" key={conflict.key}><td className="py-3 text-white">{conflict.teacherName}</td><td className="py-3 text-slate-400">{conflict.day}</td><td className="py-3 text-slate-400">P{conflict.periodNumber}</td><td className="py-3 text-slate-400">{conflict.sections.join(", ")}</td></tr>)}</Table>}</Panel>
    </>}
    <Panel title="Saved timetables" eyebrow="Existing drafts and publications"><Table headers={["Version", "Status", "Entries", "Last updated", "Action"]}>{timetables.map((item) => <tr className="border-t border-slate-800" key={item.id}><td className="py-4 font-mono text-cyan-200">v{item.version}</td><td className="py-4"><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300">{item.status}</span></td><td className="py-4 text-slate-400">{item.entries}</td><td className="py-4 text-slate-500">{new Date(item.updatedAt).toLocaleString()}</td><td className="py-4 text-right"><button className="rounded-xl border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/10" onClick={() => deleteTimetable(item)}>Delete</button></td></tr>)}</Table>{!timetables.length && <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">No timetable drafts yet. Generate one to see the weekly grid.</p>}</Panel>
  </div>;
}
