import { redirect } from "next/navigation";
import { Role, TimetableStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StudentPortal } from "@/components/student/student-portal";

export default async function StudentPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== Role.STUDENT) redirect(session.user.role === Role.ADMIN ? "/admin" : "/teacher");

  const student = await prisma.student.findUnique({ where: { userId: session.user.id }, include: { user: true, section: { include: { class: true } } } });
  if (!student) return <StudentPortal name={session.user.name ?? "Student"} email={session.user.email ?? ""} className="" sectionName="" periods={[]} workingDays={[]} entries={[]} />;

  const [entries, periods, workingDays] = await Promise.all([
    prisma.timetableEntry.findMany({ where: { sectionId: student.sectionId, timetable: { status: TimetableStatus.PUBLISHED } }, include: { subject: true, teacher: { include: { user: true } }, room: true, period: true }, orderBy: [{ day: "asc" }, { period: { periodNumber: "asc" } }] }),
    prisma.period.findMany({ orderBy: { periodNumber: "asc" } }),
    prisma.workingDay.findMany({ where: { enabled: true }, orderBy: { day: "asc" } }),
  ]);

  return <StudentPortal name={student.user.name ?? "Student"} email={student.user.email} className={student.section.class.name} sectionName={student.section.name} periods={periods} workingDays={workingDays} entries={entries.map((entry) => ({ id: entry.id, subject: entry.subject.name, teacher: entry.teacher.user.name ?? entry.teacher.employeeCode, room: entry.room.name, day: entry.day, periodId: entry.periodId, periodNumber: entry.period.periodNumber, startTime: entry.period.startTime, endTime: entry.period.endTime }))} />;
}
