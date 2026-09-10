export type ValidationEntry = {
  assignmentId?: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  day: string;
  periodId: string;
};

type Assignment = { id: string; sectionId: string; subjectId: string; teacherId: string; requiredWeeklyPeriods: number };
type Section = { id: string; capacity: number; defaultRoomId: string | null };
type Room = { id: string; capacity: number };
type Availability = { teacherId?: string; sectionId?: string; roomId?: string; day: string; periodId: string; status: string };

type ValidationContext = {
  assignments: Assignment[];
  sections: Section[];
  rooms: Room[];
  periods: { id: string }[];
  workingDays: { day: string; enabled: boolean }[];
  teacherAvailability: Availability[];
  sectionAvailability: Availability[];
  roomAvailability: Availability[];
};

export function validateTimetable(entries: ValidationEntry[], context: ValidationContext) {
  const errors: string[] = [];
  const assignments = new Map(context.assignments.map((assignment) => [assignment.id, assignment]));
  const sections = new Map(context.sections.map((section) => [section.id, section]));
  const rooms = new Map(context.rooms.map((room) => [room.id, room]));
  const periods = new Set(context.periods.map((period) => period.id));
  const workingDays = new Set(context.workingDays.filter((day) => day.enabled).map((day) => day.day));
  const unavailable = (records: Availability[], key: "teacherId" | "sectionId" | "roomId") => new Set(records.filter((record) => record.status === "UNAVAILABLE").map((record) => `${record[key]}:${record.day}:${record.periodId}`));
  const unavailableTeachers = unavailable(context.teacherAvailability, "teacherId");
  const unavailableSections = unavailable(context.sectionAvailability, "sectionId");
  const unavailableRooms = unavailable(context.roomAvailability, "roomId");
  const teacherSlots = new Set<string>();
  const sectionSlots = new Set<string>();
  const roomSlots = new Set<string>();
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const assignment = entry.assignmentId
      ? assignments.get(entry.assignmentId)
      : context.assignments.find((candidate) => candidate.sectionId === entry.sectionId && candidate.subjectId === entry.subjectId && candidate.teacherId === entry.teacherId);
    const section = sections.get(entry.sectionId);
    const room = rooms.get(entry.roomId);
    if (!assignment) errors.push(`Entry ${entry.assignmentId ?? `${entry.sectionId}/${entry.subjectId}/${entry.teacherId}`} is not a valid teacher assignment`);
    if (!section) errors.push(`Entry references an unknown section ${entry.sectionId}`);
    if (!room) errors.push(`Entry references an unknown room ${entry.roomId}`);
    if (!periods.has(entry.periodId) || !workingDays.has(entry.day)) errors.push(`Entry uses an unconfigured day or period`);
    if (assignment && (assignment.sectionId !== entry.sectionId || assignment.subjectId !== entry.subjectId || assignment.teacherId !== entry.teacherId)) errors.push(`Entry ${entry.assignmentId} does not match its teacher-subject-section assignment`);
    if (section && room && room.capacity < section.capacity) errors.push(`Room ${entry.roomId} cannot hold section ${entry.sectionId}`);
    if (section && section.defaultRoomId && entry.roomId !== section.defaultRoomId) errors.push(`Section ${entry.sectionId} must use its default room ${section.defaultRoomId}`);
    if (unavailableTeachers.has(`${entry.teacherId}:${entry.day}:${entry.periodId}`)) errors.push(`Teacher ${entry.teacherId} is unavailable at ${entry.day} ${entry.periodId}`);
    if (unavailableSections.has(`${entry.sectionId}:${entry.day}:${entry.periodId}`)) errors.push(`Section ${entry.sectionId} is unavailable at ${entry.day} ${entry.periodId}`);
    if (unavailableRooms.has(`${entry.roomId}:${entry.day}:${entry.periodId}`)) errors.push(`Room ${entry.roomId} is unavailable at ${entry.day} ${entry.periodId}`);
    const teacherSlot = `${entry.teacherId}:${entry.day}:${entry.periodId}`;
    const sectionSlot = `${entry.sectionId}:${entry.day}:${entry.periodId}`;
    const roomSlot = `${entry.roomId}:${entry.day}:${entry.periodId}`;
    if (teacherSlots.has(teacherSlot)) errors.push(`Teacher collision at ${entry.day} ${entry.periodId}`); else teacherSlots.add(teacherSlot);
    if (sectionSlots.has(sectionSlot)) errors.push(`Section collision at ${entry.day} ${entry.periodId}`); else sectionSlots.add(sectionSlot);
    if (roomSlots.has(roomSlot)) errors.push(`Room collision at ${entry.day} ${entry.periodId}`); else roomSlots.add(roomSlot);
    if (assignment) counts.set(assignment.id, (counts.get(assignment.id) ?? 0) + 1);
  }

  for (const assignment of context.assignments) {
    const actual = counts.get(assignment.id) ?? 0;
    if (actual !== assignment.requiredWeeklyPeriods) errors.push(`Assignment ${assignment.id} requires ${assignment.requiredWeeklyPeriods} periods but has ${actual}`);
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
