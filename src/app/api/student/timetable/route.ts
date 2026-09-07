import { NextResponse } from "next/server";
import { TimetableStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Student access required" }, { status: 403 });

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: { section: { include: { class: true } }, user: { select: { name: true, email: true } } },
  });
  if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  const [entries, periods, workingDays] = await Promise.all([
    prisma.timetableEntry.findMany({
      where: { sectionId: student.sectionId, timetable: { status: TimetableStatus.PUBLISHED } },
      include: { subject: true, teacher: { include: { user: true } }, room: true, period: true },
      orderBy: [{ day: "asc" }, { period: { periodNumber: "asc" } }],
    }),
    prisma.period.findMany({ orderBy: { periodNumber: "asc" } }),
    prisma.workingDay.findMany({ where: { enabled: true }, orderBy: { day: "asc" } }),
  ]);

  return NextResponse.json({
    student: { name: student.user.name ?? "Student", email: student.user.email, className: student.section.class.name, section: student.section.name, sectionId: student.sectionId },
    periods,
    workingDays,
    entries: entries.map((entry) => ({ id: entry.id, subject: entry.subject.name, teacher: entry.teacher.user.name ?? entry.teacher.employeeCode, room: entry.room.name, day: entry.day, periodId: entry.periodId, periodNumber: entry.period.periodNumber, startTime: entry.period.startTime, endTime: entry.period.endTime })),
  });
}
