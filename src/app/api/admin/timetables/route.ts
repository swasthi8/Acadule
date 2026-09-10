import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { TimetableStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard, failure, invalid } from "@/lib/admin-api";
import { validateTimetable } from "@/lib/timetable-validation";
import { prevalidateTimetable } from "@/lib/timetable-prevalidation";

export async function GET() { const denied = await adminGuard(); if (denied) return denied; try { return NextResponse.json(await prisma.timetable.findMany({ include: { _count: { select: { entries: true } } }, orderBy: { updatedAt: "desc" } })); } catch (error) { return failure(error); } }

function runSolver(payload: Record<string, unknown>) {
	const solverUrl = process.env.SOLVER_URL;
	if (solverUrl) return fetch(`${solverUrl.replace(/\/$/, "")}/solve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.detail ?? "Solver request failed"); return result; });
	const localPython = join(process.cwd(), ".venv", "Scripts", "python.exe");
	const executable = process.env.SOLVER_PYTHON ?? (existsSync(localPython) ? localPython : "python");
	return new Promise<Record<string, unknown>>((resolve, reject) => {
		const child = spawn(executable, ["-m", "solver.main"], { cwd: process.cwd(), windowsHide: true });
		let output = ""; let errorOutput = "";
		child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString(); });
		child.stderr.on("data", (chunk: Buffer) => { errorOutput += chunk.toString(); });
		child.on("error", reject);
		child.on("close", (code) => { if (code !== 0) return reject(new Error(errorOutput || `Solver exited with code ${code}`)); try { resolve(JSON.parse(output) as Record<string, unknown>); } catch { reject(new Error("Solver returned invalid JSON")); } });
		child.stdin.end(JSON.stringify(payload));
	});
}

export async function POST() {
	const denied = await adminGuard(); if (denied) return denied;
	try {
		const [sections, teachers, subjects, rooms, periods, workingDays, teacherAvailability, roomAvailability, sectionAvailability, sectionSubjects, assignmentRows, latest] = await Promise.all([
			prisma.section.findMany({ select: { id: true, capacity: true, defaultRoomId: true } }),
			prisma.teacher.findMany({ select: { id: true, user: { select: { name: true, email: true } } } }),
			prisma.subject.findMany({ select: { id: true } }),
			prisma.room.findMany({ select: { id: true, capacity: true } }),
			prisma.period.findMany({ select: { id: true }, orderBy: { periodNumber: "asc" } }),
			prisma.workingDay.findMany({ select: { day: true, enabled: true } }),
			prisma.teacherAvailability.findMany({ select: { teacherId: true, day: true, periodId: true, status: true } }),
			prisma.roomAvailability.findMany({ select: { roomId: true, day: true, periodId: true, status: true } }),
			prisma.sectionAvailability.findMany({ select: { sectionId: true, day: true, periodId: true, status: true } }),
			prisma.sectionSubject.findMany({ include: { section: { include: { class: true } }, subject: true } }),
			prisma.teacherAssignment.findMany({ include: { sectionSubject: { include: { section: { include: { class: true } }, subject: true } } } }),
			prisma.timetable.findFirst({ orderBy: { version: "desc" }, select: { version: true } }),
		]);
		if (!assignmentRows.length) return invalid("Create at least one teacher assignment before generating a timetable");
		const prevalidation = prevalidateTimetable({ teachers, periods, workingDays, teacherAvailability, sectionSubjects, assignments: assignmentRows });
		if (!prevalidation.valid) return NextResponse.json({ error: "Timetable cannot be generated", conflicts: prevalidation.errors, teacherCapacity: prevalidation.teacherCapacity }, { status: 422 });
		const assignments = assignmentRows.map((row) => ({ id: row.id, teacherId: row.teacherId, sectionId: row.sectionSubject.sectionId, subjectId: row.sectionSubject.subjectId, requiredWeeklyPeriods: row.sectionSubject.requiredWeeklyPeriods }));
		const input = { sections, teachers, subjects, rooms, periods, workingDays, assignments, availability: { teachers: teacherAvailability, rooms: roomAvailability, sections: sectionAvailability } };
		const solverResult = await runSolver(input);
		if (solverResult.success !== true) return NextResponse.json({ error: "No feasible timetable found", conflicts: solverResult.errors ?? [], statistics: solverResult.statistics ?? {} }, { status: 422 });
		const entries = Array.isArray(solverResult.entries) ? solverResult.entries as Array<{ assignmentId: string; sectionId: string; subjectId: string; teacherId: string; roomId: string; day: string; periodId: string }> : [];
		const validation = validateTimetable(entries, { assignments, sections, rooms, periods, workingDays, teacherAvailability, sectionAvailability, roomAvailability });
		if (!validation.valid) return NextResponse.json({ error: "Generated timetable failed validation", conflicts: validation.errors }, { status: 422 });
		const timetable = await prisma.timetable.create({ data: { version: (latest?.version ?? 0) + 1, status: TimetableStatus.DRAFT, entries: { create: entries.map((entry) => ({ sectionId: entry.sectionId, subjectId: entry.subjectId, teacherId: entry.teacherId, roomId: entry.roomId, day: entry.day as never, periodId: entry.periodId })) } }, include: { entries: true } });
		return NextResponse.json({ timetable, validation: { valid: true, errors: [] }, statistics: solverResult.statistics ?? {} }, { status: 201 });
	} catch (error) { return failure(error); }
}
