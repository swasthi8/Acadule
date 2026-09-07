type SectionSubjectRecord = {
  id: string;
  sectionId: string;
  subjectId: string;
  requiredWeeklyPeriods: number;
  section: { name: string; class: { name: string } };
  subject: { name: string; code: string };
};

type AssignmentRecord = {
  id: string;
  teacherId: string;
  sectionSubject: SectionSubjectRecord;
};

type TeacherRecord = { id: string; user: { name: string | null; email: string } };
type AvailabilityRecord = { teacherId: string; day: string; periodId: string; status: string };

type PrevalidationInput = {
  teachers: TeacherRecord[];
  periods: { id: string }[];
  workingDays: { day: string; enabled: boolean }[];
  teacherAvailability: AvailabilityRecord[];
  sectionSubjects: SectionSubjectRecord[];
  assignments: AssignmentRecord[];
};

export type TimetablePrevalidation = {
  valid: boolean;
  errors: string[];
  teacherCapacity: Array<{ teacherId: string; teacherName: string; requiredPeriods: number; availableSlots: number; assignments: string[] }>;
};

export function prevalidateTimetable(input: PrevalidationInput): TimetablePrevalidation {
  const errors: string[] = [];
  const teacherById = new Map(input.teachers.map((teacher) => [teacher.id, teacher]));
  const assignmentsBySectionSubject = new Set(input.assignments.map((assignment) => `${assignment.sectionSubject.sectionId}:${assignment.sectionSubject.subjectId}`));
  const enabledDays = input.workingDays.filter((day) => day.enabled);
  const unavailable = new Set(input.teacherAvailability.filter((record) => record.status === "UNAVAILABLE").map((record) => `${record.teacherId}:${record.day}:${record.periodId}`));
  const teacherCapacity: TimetablePrevalidation["teacherCapacity"] = [];

  for (const sectionSubject of input.sectionSubjects) {
    const key = `${sectionSubject.sectionId}:${sectionSubject.subjectId}`;
    if (!assignmentsBySectionSubject.has(key)) {
      errors.push(`No teacher assignment exists for ${sectionSubject.subject.code} (${sectionSubject.subject.name}) in ${sectionSubject.section.class.name} / ${sectionSubject.section.name}; ${sectionSubject.requiredWeeklyPeriods} weekly periods cannot be scheduled.`);
    }
  }

  for (const assignment of input.assignments) {
    if (!teacherById.has(assignment.teacherId)) {
      errors.push(`Assignment ${assignment.id} for ${assignment.sectionSubject.subject.code} in ${assignment.sectionSubject.section.class.name} / ${assignment.sectionSubject.section.name} references a teacher that does not exist.`);
    }
  }

  for (const teacher of input.teachers) {
    const teacherAssignments = input.assignments.filter((assignment) => assignment.teacherId === teacher.id);
    const requiredPeriods = teacherAssignments.reduce((total, assignment) => total + assignment.sectionSubject.requiredWeeklyPeriods, 0);
    const availableSlots = enabledDays.reduce((total, day) => total + input.periods.filter((period) => !unavailable.has(`${teacher.id}:${day.day}:${period.id}`)).length, 0);
    const teacherName = teacher.user.name ?? teacher.user.email;
    const assignmentLabels = teacherAssignments.map((assignment) => `${assignment.sectionSubject.subject.code} in ${assignment.sectionSubject.section.class.name} / ${assignment.sectionSubject.section.name} (${assignment.sectionSubject.requiredWeeklyPeriods} periods)`);
    teacherCapacity.push({ teacherId: teacher.id, teacherName, requiredPeriods, availableSlots, assignments: assignmentLabels });

    if (requiredPeriods > availableSlots) {
      errors.push(`Teacher ${teacherName} requires ${requiredPeriods} weekly teaching periods but has only ${availableSlots} available working-day periods after availability is applied. Affected assignments: ${assignmentLabels.join("; ") || "none"}. Timetable cannot be generated because the available teacher assignments cannot cover all required weekly subject periods.`);
    }
  }

  if (!input.teachers.length && input.assignments.length) errors.push("Timetable cannot be generated because teacher assignments reference teachers that are not available in the academic data.");
  if (enabledDays.length === 0 || input.periods.length === 0) errors.push("Timetable cannot be generated because no enabled working days or periods are configured.");

  return { valid: errors.length === 0, errors: [...new Set(errors)], teacherCapacity };
}
