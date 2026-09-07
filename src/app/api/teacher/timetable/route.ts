import { NextResponse } from "next/server";
import { TimetableStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

export async function GET() {
  const session = await requireTeacher();
  if (!session) return NextResponse.json({ error: "Teacher access required" }, { status: 403 });

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

  const [entries, periods, workingDays] = await Promise.all([
    prisma.timetableEntry.findMany({
      where: { teacherId: teacher.id, timetable: { status: TimetableStatus.PUBLISHED } },
      include: { subject: true, section: { include: { class: true } }, room: true, period: true, timetable: { select: { id: true, version: true, publishedAt: true } } },
      orderBy: [{ day: "asc" }, { period: { periodNumber: "asc" } }],
    }),
    prisma.period.findMany({ orderBy: { periodNumber: "asc" } }),
    prisma.workingDay.findMany({ where: { enabled: true }, orderBy: { day: "asc" } }),
  ]);

  return NextResponse.json({
    teacher: { id: teacher.id, name: session.user.name ?? "Teacher", email: session.user.email ?? "" },
    periods,
    workingDays,
    entries: entries.map((entry) => ({
      id: entry.id,
      subject: entry.subject.name,
      sectionId: entry.sectionId,
      section: entry.section.name,
      className: entry.section.class.name,
      room: entry.room.name,
      day: entry.day,
      periodId: entry.periodId,
      periodNumber: entry.period.periodNumber,
      startTime: entry.period.startTime,
      endTime: entry.period.endTime,
      timetableId: entry.timetable.id,
      timetableVersion: entry.timetable.version,
      publishedAt: entry.timetable.publishedAt,
    })),
  });
}
