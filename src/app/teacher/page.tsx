import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TeacherPortal } from "@/components/teacher/teacher-portal";

export default async function TeacherPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== Role.TEACHER) redirect(session.user.role === Role.ADMIN ? "/admin" : "/");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!teacher) return <TeacherPortal name={session.user.name ?? "Teacher"} email={session.user.email ?? ""} periods={[]} workingDays={[]} entries={[]} />;

  const [entries, periods, workingDays] = await Promise.all([
    prisma.timetableEntry.findMany({ where: { teacherId: teacher.id, timetable: { status: "PUBLISHED" } }, include: { subject: true, section: { include: { class: true } }, room: true, period: true }, orderBy: [{ day: "asc" }, { period: { periodNumber: "asc" } }] }),
    prisma.period.findMany({ orderBy: { periodNumber: "asc" } }),
    prisma.workingDay.findMany({ where: { enabled: true }, orderBy: { day: "asc" } }),
  ]);

  return <TeacherPortal name={session.user.name ?? "Teacher"} email={session.user.email ?? ""} periods={periods} workingDays={workingDays} entries={entries.map((entry) => ({ id: entry.id, subject: entry.subject.name, sectionId: entry.sectionId, section: entry.section.name, className: entry.section.class.name, room: entry.room.name, day: entry.day, periodId: entry.periodId, periodNumber: entry.period.periodNumber, startTime: entry.period.startTime, endTime: entry.period.endTime }))} />;
}
