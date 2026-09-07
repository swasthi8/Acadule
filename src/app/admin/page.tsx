import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminPortal } from "@/components/admin/admin-portal";
import type { DashboardSummary } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) redirect("/");

  const [teachers, students, classes, sections, subjects, rooms, periods, assignments, sectionSubjects, teacherAvailability, sectionAvailability, roomAvailability] = await Promise.all([
    prisma.teacher.findMany({ include: { user: true }, orderBy: { employeeCode: "asc" } }),
    prisma.student.findMany({ include: { user: true, section: { include: { class: true } } }, orderBy: { studentCode: "asc" } }),
    prisma.class.findMany({ include: { sections: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.section.findMany({ include: { class: true }, orderBy: [{ class: { name: "asc" } }, { name: "asc" }] }),
    prisma.subject.findMany({ orderBy: { code: "asc" } }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.period.findMany({ orderBy: { periodNumber: "asc" } }),
    prisma.teacherAssignment.findMany({ include: { teacher: { include: { user: true } }, sectionSubject: { include: { section: { include: { class: true } }, subject: true } } }, orderBy: { id: "asc" } }),
    prisma.sectionSubject.findMany({ include: { section: { include: { class: true } }, subject: true }, orderBy: [{ sectionId: "asc" }, { subjectId: "asc" }] }),
    prisma.teacherAvailability.findMany({ select: { teacherId: true, day: true, periodId: true, status: true } }),
    prisma.sectionAvailability.findMany({ select: { sectionId: true, day: true, periodId: true, status: true } }),
    prisma.roomAvailability.findMany({ select: { roomId: true, day: true, periodId: true, status: true } }),
  ]);

  const timetables = await prisma.timetable.findMany({ include: { _count: { select: { entries: true } }, entries: { include: { subject: true, teacher: { include: { user: true } }, room: true, period: true }, orderBy: { day: "asc" } } }, orderBy: { updatedAt: "desc" }, take: 10 });
  const assignmentSummaries = assignments.map((assignment) => ({ id: assignment.id, teacherId: assignment.teacherId, teacherName: assignment.teacher.user.name ?? assignment.teacher.employeeCode, sectionSubjectId: assignment.sectionSubjectId, sectionName: `${assignment.sectionSubject.section.class.name} / ${assignment.sectionSubject.section.name}`, subjectName: assignment.sectionSubject.subject.name, requiredWeeklyPeriods: assignment.sectionSubject.requiredWeeklyPeriods }));
  const sectionSubjectSummaries = sectionSubjects.map((item) => ({ id: item.id, sectionId: item.sectionId, sectionName: `${item.section.class.name} / ${item.section.name}`, subjectName: item.subject.name, requiredWeeklyPeriods: item.requiredWeeklyPeriods }));
  const timetableSummaries = timetables.map((timetable) => {
    const timetableEntries = timetable.entries.map((entry) => ({ id: entry.id, sectionId: entry.sectionId, subjectName: entry.subject.name, teacherName: entry.teacher.user.name ?? entry.teacher.employeeCode, teacherId: entry.teacherId, roomName: entry.room.name, day: entry.day, periodId: entry.periodId, periodNumber: entry.period.periodNumber }));
    const requirements = sectionSubjectSummaries.map((requirement) => { const scheduled = timetableEntries.filter((entry) => entry.sectionId === requirement.sectionId && entry.subjectName === requirement.subjectName).length; return { ...requirement, scheduled, status: scheduled === requirement.requiredWeeklyPeriods ? "PASS" : "CHECK" }; });
    const workload = teachers.map((teacher) => { const required = assignmentSummaries.filter((assignment) => assignment.teacherId === teacher.id).reduce((total, assignment) => total + assignment.requiredWeeklyPeriods, 0); const scheduled = timetableEntries.filter((entry) => entry.teacherId === teacher.id).length; return { teacherId: teacher.id, teacherName: teacher.user.name ?? teacher.employeeCode, required, scheduled }; }).filter((item) => item.required > 0 || item.scheduled > 0);
    const teacherSlots = new Set<string>(); const sectionSlots = new Set<string>(); const roomSlots = new Set<string>();
    timetableEntries.forEach((entry) => { teacherSlots.add(`${entry.teacherId}:${entry.day}:${entry.periodId}`); sectionSlots.add(`${entry.sectionId}:${entry.day}:${entry.periodId}`); roomSlots.add(`${entry.roomName}:${entry.day}:${entry.periodId}`); });
    const teacherConflicts = timetableEntries.reduce((conflicts, entry) => { const key = `${entry.teacherId}:${entry.day}:${entry.periodId}`; const prior = timetableEntries.filter((candidate) => candidate.teacherId === entry.teacherId && candidate.day === entry.day && candidate.periodId === entry.periodId && candidate.id !== entry.id); if (prior.length && !conflicts.some((conflict) => conflict.key === key)) conflicts.push({ key, teacherName: entry.teacherName, day: entry.day, periodNumber: entry.periodNumber, sections: [entry.sectionId, ...prior.map((candidate) => candidate.sectionId)] }); return conflicts; }, [] as { key: string; teacherName: string; day: string; periodNumber: number; sections: string[] }[]);
    return { id: timetable.id, version: timetable.version, status: timetable.status, entries: timetable._count.entries, updatedAt: timetable.updatedAt.toISOString(), timetableEntries, requirements, workload, teacherConflicts, collisionHealth: { teacher: new Set(timetableEntries.map((entry) => `${entry.teacherId}:${entry.day}:${entry.periodId}`)).size === timetableEntries.length, section: new Set(timetableEntries.map((entry) => `${entry.sectionId}:${entry.day}:${entry.periodId}`)).size === timetableEntries.length, room: new Set(timetableEntries.map((entry) => `${entry.roomName}:${entry.day}:${entry.periodId}`)).size === timetableEntries.length } };
  });
  const latest = timetableSummaries[0];
  const unavailableTeacherSlots = new Set(teacherAvailability.filter((item) => item.status === "UNAVAILABLE").map((item) => `${item.teacherId}:${item.day}:${item.periodId}`));
  const unavailableSectionSlots = new Set(sectionAvailability.filter((item) => item.status === "UNAVAILABLE").map((item) => `${item.sectionId}:${item.day}:${item.periodId}`));
  const unavailableRoomSlots = new Set(roomAvailability.filter((item) => item.status === "UNAVAILABLE").map((item) => `${item.roomId}:${item.day}:${item.periodId}`));
  const latestEntries = latest?.timetableEntries ?? [];
  const latestRawEntries = latest ? timetables.find((item) => item.id === latest.id)?.entries ?? [] : [];
  const availabilityPass = latestRawEntries.every((entry) => !unavailableTeacherSlots.has(`${entry.teacherId}:${entry.day}:${entry.periodId}`) && !unavailableSectionSlots.has(`${entry.sectionId}:${entry.day}:${entry.periodId}`) && !unavailableRoomSlots.has(`${entry.roomId}:${entry.day}:${entry.periodId}`));
  const capacityPass = latestRawEntries.every((entry) => { const section = sections.find((item) => item.id === entry.sectionId); return section ? entry.room.capacity >= section.capacity : false; });
  const requiredPeriods = sectionSubjects.reduce((total, item) => total + item.requiredWeeklyPeriods, 0);
  const latestValidation: NonNullable<DashboardSummary["latestTimetable"]>["validation"] = latest ? latest.status === "PUBLISHED" || latest.status === "VALIDATED" ? "PASS" : latestEntries.length === requiredPeriods && latest.requirements.every((item) => item.status === "PASS") ? "PASS" : "CHECK" : "NOT_RUN";
  const dashboardSummary: DashboardSummary = { latestTimetable: latest ? { version: latest.version, status: latest.status, scheduledEntries: latest.entries, requiredPeriods, updatedAt: latest.updatedAt, validation: latestValidation } : null, health: latest ? [{ label: "Teacher conflicts", status: latest.teacherConflicts.length ? "CHECK" : "PASS" }, { label: "Section conflicts", status: latest.collisionHealth.section ? "PASS" : "CHECK" }, { label: "Room conflicts", status: latest.collisionHealth.room ? "PASS" : "CHECK" }, { label: "Availability", status: availabilityPass ? "PASS" : "CHECK" }, { label: "Subject requirements", status: latest.requirements.every((item) => item.status === "PASS") ? "PASS" : "CHECK" }, { label: "Room capacity", status: capacityPass ? "PASS" : "CHECK" }] : [{ label: "Teacher conflicts", status: "NOT_RUN" }, { label: "Section conflicts", status: "NOT_RUN" }, { label: "Room conflicts", status: "NOT_RUN" }, { label: "Availability", status: "NOT_RUN" }, { label: "Subject requirements", status: "NOT_RUN" }, { label: "Room capacity", status: "NOT_RUN" }], workload: latest?.workload ?? [] };

  return (
    <AdminPortal
      adminName={session.user.name ?? "Admin"}
      data={{
        teachers: teachers.map(({ user, ...teacher }) => ({ ...teacher, name: user.name ?? "Unnamed", email: user.email })),
        students: students.map(({ user, section, ...student }) => ({ ...student, name: user.name ?? "Unnamed", email: user.email, sectionName: `${section.class.name} / ${section.name}` })),
        classes,
        sections: sections.map((section) => ({ id: section.id, name: section.name, capacity: section.capacity, classId: section.classId, className: section.class.name })),
        subjects,
        rooms,
        periods,
        assignments: assignmentSummaries,
        sectionSubjects: sectionSubjectSummaries,
        timetables: timetableSummaries,
        dashboardSummary,
      }}
    />
  );
}
