import { NextResponse } from "next/server";
import { TimetableStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard, failure } from "@/lib/admin-api";
import { validateTimetable } from "@/lib/timetable-validation";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const denied = await adminGuard(); if (denied) return denied;
  try {
    const [timetable, sections, rooms, periods, workingDays, teacherAvailability, sectionAvailability, roomAvailability, assignmentRows] = await Promise.all([
      prisma.timetable.findUnique({ where: { id: params.id }, include: { entries: true } }),
      prisma.section.findMany({ select: { id: true, capacity: true, defaultRoomId: true } }),
      prisma.room.findMany({ select: { id: true, capacity: true } }),
      prisma.period.findMany({ select: { id: true } }),
      prisma.workingDay.findMany({ select: { day: true, enabled: true } }),
      prisma.teacherAvailability.findMany({ select: { teacherId: true, day: true, periodId: true, status: true } }),
      prisma.sectionAvailability.findMany({ select: { sectionId: true, day: true, periodId: true, status: true } }),
      prisma.roomAvailability.findMany({ select: { roomId: true, day: true, periodId: true, status: true } }),
      prisma.teacherAssignment.findMany({ include: { sectionSubject: true } }),
    ]);
    if (!timetable) return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    const assignments = assignmentRows.map((row) => ({ id: row.id, teacherId: row.teacherId, sectionId: row.sectionSubject.sectionId, subjectId: row.sectionSubject.subjectId, requiredWeeklyPeriods: row.sectionSubject.requiredWeeklyPeriods }));
    const result = validateTimetable(timetable.entries, { assignments, sections, rooms, periods, workingDays, teacherAvailability, sectionAvailability, roomAvailability });
    if (!result.valid) return NextResponse.json({ valid: false, errors: result.errors }, { status: 422 });
    const updated = await prisma.timetable.update({ where: { id: params.id }, data: { status: TimetableStatus.VALIDATED } });
    return NextResponse.json({ valid: true, errors: [], timetable: updated });
  } catch (error) { return failure(error); }
}
