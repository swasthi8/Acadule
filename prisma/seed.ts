import { AvailabilityStatus, DayOfWeek, PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "AcaduleDemo123!";
const weekdays = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];

const teacherData = [
  { name: "Arjun Mehta", code: "T-001", email: "arjun@acadule.test" },
  { name: "Meera Shah", code: "T-002", email: "meera@acadule.test" },
  { name: "Priya Rao", code: "T-003", email: "priya@acadule.test" },
  { name: "Rahul Kumar", code: "T-004", email: "rahul@acadule.test" },
  { name: "Sneha Reddy", code: "T-005", email: "sneha@acadule.test" },
  { name: "Kavya Nair", code: "T-006", email: "kavya@acadule.test" },
  { name: "Anil Kumar", code: "T-007", email: "anil@acadule.test" },
  { name: "Divya Sharma", code: "T-008", email: "divya@acadule.test" },
  { name: "Nikhil Rao", code: "T-009", email: "nikhil@acadule.test" },
  { name: "Pooja Menon", code: "T-010", email: "pooja@acadule.test" },
  { name: "Ananya Iyer", code: "T-011", email: "ananya@acadule.test" },
  { name: "Vikram Joshi", code: "T-012", email: "vikram@acadule.test" },
];

const subjectData = [
  { code: "PHY", name: "Physics", weeklyPeriods: 8 },
  { code: "MAT", name: "Mathematics", weeklyPeriods: 8 },
  { code: "CHE", name: "Chemistry", weeklyPeriods: 8 },
  { code: "BIO", name: "Biology", weeklyPeriods: 8 },
  { code: "LANG1", name: "Language 1", weeklyPeriods: 5 },
  { code: "LANG2", name: "Language 2", weeklyPeriods: 5 },
];

const studentData = [
  ["S-001", "Riya Nair"], ["S-002", "Aarav Menon"], ["S-003", "Ananya Iyer"], ["S-004", "Vihaan Rao"], ["S-005", "Ishita Das"],
  ["S-006", "Aditya Shetty"], ["S-007", "Nisha Kulkarni"], ["S-008", "Kabir Joshi"], ["S-009", "Tanvi Bhat"], ["S-010", "Rohan Gupta"],
  ["S-011", "Aditi Verma"], ["S-012", "Karan Singh"], ["S-013", "Saanvi Patil"], ["S-014", "Dev Malhotra"], ["S-015", "Maya Krishnan"],
  ["S-016", "Aryan Kapoor"], ["S-017", "Ira Thomas"], ["S-018", "Neil Joseph"], ["S-019", "Pooja Hegde"], ["S-020", "Manav Desai"],
] as const;

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@acadule.test" },
    update: { name: "Anita Rao", role: Role.ADMIN, passwordHash },
    create: { email: "admin@acadule.test", name: "Anita Rao", passwordHash, role: Role.ADMIN },
  });

  const teachers = new Map<string, { id: string; name: string; employeeCode: string }>();
  for (const teacherDataItem of teacherData) {
    const user = await prisma.user.upsert({
      where: { email: teacherDataItem.email },
      update: { name: teacherDataItem.name, role: Role.TEACHER, passwordHash },
      create: { email: teacherDataItem.email, name: teacherDataItem.name, passwordHash, role: Role.TEACHER },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: { employeeCode: teacherDataItem.code },
      create: { userId: user.id, employeeCode: teacherDataItem.code },
    });
    teachers.set(teacherDataItem.code, { id: teacher.id, name: teacherDataItem.name, employeeCode: teacherDataItem.code });
  }

  const legacyClass = await prisma.class.findUnique({ where: { name: "PU Science Year 1" } });
  const firstYearClassA = legacyClass
    ? await prisma.class.update({ where: { id: legacyClass.id }, data: { name: "First Year Class A" } })
    : await prisma.class.upsert({ where: { name: "First Year Class A" }, update: {}, create: { name: "First Year Class A" } });
  const firstYearClassB = await prisma.class.upsert({ where: { name: "First Year Class B" }, update: {}, create: { name: "First Year Class B" } });
  const secondYearClassA = await prisma.class.upsert({ where: { name: "Second Year Class A" }, update: {}, create: { name: "Second Year Class A" } });
  const secondYearClassB = await prisma.class.upsert({ where: { name: "Second Year Class B" }, update: {}, create: { name: "Second Year Class B" } });

  const unwantedClass = await prisma.class.findUnique({ where: { name: "PU Science Year 2" }, include: { sections: { include: { students: true, timetableEntries: true } } } });
  if (unwantedClass && unwantedClass.sections.every((section) => section.students.length === 0 && section.timetableEntries.length === 0)) {
    await prisma.sectionAvailability.deleteMany({ where: { sectionId: { in: unwantedClass.sections.map((section) => section.id) } } });
    await prisma.sectionSubject.deleteMany({ where: { sectionId: { in: unwantedClass.sections.map((section) => section.id) } } });
    await prisma.section.deleteMany({ where: { classId: unwantedClass.id } });
    await prisma.class.delete({ where: { id: unwantedClass.id } });
  }

  const legacySectionB = await prisma.section.findUnique({ where: { classId_name: { classId: firstYearClassA.id, name: "B" } } });
  if (legacySectionB) await prisma.section.update({ where: { id: legacySectionB.id }, data: { classId: firstYearClassB.id, capacity: 36 } });

  const sectionA = await prisma.section.upsert({ where: { classId_name: { classId: firstYearClassA.id, name: "A" } }, update: { capacity: 40 }, create: { classId: firstYearClassA.id, name: "A", capacity: 40 } });
  const sectionB = await prisma.section.upsert({ where: { classId_name: { classId: firstYearClassB.id, name: "B" } }, update: { capacity: 36 }, create: { classId: firstYearClassB.id, name: "B", capacity: 36 } });
  const sectionSecondA = await prisma.section.upsert({ where: { classId_name: { classId: secondYearClassA.id, name: "A" } }, update: { capacity: 40 }, create: { classId: secondYearClassA.id, name: "A", capacity: 40 } });
  const sectionSecondB = await prisma.section.upsert({ where: { classId_name: { classId: secondYearClassB.id, name: "B" } }, update: { capacity: 36 }, create: { classId: secondYearClassB.id, name: "B", capacity: 36 } });
  const sections = [sectionA, sectionB, sectionSecondA, sectionSecondB];

  for (let index = 0; index < studentData.length; index += 1) {
    const [studentCode, name] = studentData[index];
    const email = studentCode === "S-001" ? "student@acadule.test" : studentCode === "S-011" ? "studentb@acadule.test" : `${studentCode.toLowerCase()}@acadule.test`;
    const sectionId = index < 10 ? sectionA.id : sectionB.id;
    const existingStudent = await prisma.student.findUnique({ where: { studentCode }, select: { id: true, userId: true } });
    if (existingStudent) {
      await prisma.user.update({ where: { id: existingStudent.userId }, data: { email, name, role: Role.STUDENT, passwordHash } });
      await prisma.student.update({ where: { id: existingStudent.id }, data: { sectionId } });
    } else {
      const user = await prisma.user.upsert({
        where: { email },
        update: { name, role: Role.STUDENT, passwordHash },
        create: { email, name, passwordHash, role: Role.STUDENT },
      });
      await prisma.student.create({ data: { userId: user.id, studentCode, sectionId } });
    }
  }

  const subjects = new Map<string, { id: string; weeklyPeriods: number }>();
  for (const subjectDataItem of subjectData) {
    const subject = await prisma.subject.upsert({
      where: { code: subjectDataItem.code },
      update: { name: subjectDataItem.name },
      create: { code: subjectDataItem.code, name: subjectDataItem.name },
    });
    subjects.set(subjectDataItem.code, { id: subject.id, weeklyPeriods: subjectDataItem.weeklyPeriods });
  }

  const firstYearATeachers = [["T-009", "PHY"], ["T-012", "MAT"], ["T-010", "CHE"], ["T-011", "BIO"], ["T-005", "LANG1"], ["T-006", "LANG2"]] as const;
  const secondYearATeachers = [["T-001", "PHY"], ["T-002", "MAT"], ["T-003", "CHE"], ["T-004", "BIO"], ["T-005", "LANG1"], ["T-006", "LANG2"]] as const;
  const sectionPlans = [
    { section: sectionA, label: "First Year Class A", plan: firstYearATeachers },
    { section: sectionB, label: "First Year Class B", plan: secondYearATeachers },
    { section: sectionSecondA, label: "Second Year Class A", plan: secondYearATeachers },
    { section: sectionSecondB, label: "Second Year Class B", plan: firstYearATeachers },
  ];
  const assignments: Array<{ id: string; teacherId: string; sectionId: string; subjectId: string; requiredWeeklyPeriods: number }> = [];
  for (const sectionPlan of sectionPlans) {
    const section = sectionPlan.section;
    for (const [teacherCode, subjectCode] of sectionPlan.plan) {
      const subject = subjects.get(subjectCode);
      const teacher = teachers.get(teacherCode);
      if (!subject || !teacher) throw new Error(`Seed configuration is missing ${teacherCode} or ${subjectCode}`);
      const sectionSubject = await prisma.sectionSubject.upsert({
        where: { sectionId_subjectId: { sectionId: section.id, subjectId: subject.id } },
        update: { requiredWeeklyPeriods: subject.weeklyPeriods },
        create: { sectionId: section.id, subjectId: subject.id, requiredWeeklyPeriods: subject.weeklyPeriods },
      });
      await prisma.teacherAssignment.deleteMany({ where: { sectionSubjectId: sectionSubject.id, NOT: { teacherId: teacher.id } } });
      const assignment = await prisma.teacherAssignment.upsert({
        where: { teacherId_sectionSubjectId: { teacherId: teacher.id, sectionSubjectId: sectionSubject.id } },
        update: {},
        create: { teacherId: teacher.id, sectionSubjectId: sectionSubject.id },
      });
      assignments.push({ id: assignment.id, teacherId: teacher.id, sectionId: section.id, subjectId: subject.id, requiredWeeklyPeriods: subject.weeklyPeriods });
    }
  }

  const periods = await Promise.all([
    [1, "08:30", "09:30"], [2, "09:30", "10:30"], [3, "10:45", "11:45"], [4, "11:45", "12:45"], [5, "14:00", "15:00"], [6, "15:00", "16:00"], [7, "16:00", "17:00"],
  ].map(([periodNumber, startTime, endTime]) => prisma.period.upsert({
    where: { periodNumber: Number(periodNumber) },
    update: { startTime: String(startTime), endTime: String(endTime) },
    create: { periodNumber: Number(periodNumber), startTime: String(startTime), endTime: String(endTime) },
  })));

  const rooms = await Promise.all([
    ["Room 101", 45], ["Room 102", 45], ["Room 103", 45], ["Biology Lab", 40], ["Chemistry Lab", 40], ["Lab 1", 48],
  ].map(([name, capacity]) => prisma.room.upsert({
    where: { name: String(name) },
    update: { capacity: Number(capacity) },
    create: { name: String(name), capacity: Number(capacity) },
  })));

  for (const day of weekdays) {
    await prisma.workingDay.upsert({ where: { day }, update: { enabled: true }, create: { day, enabled: true } });
  }
  await prisma.workingDay.upsert({ where: { day: DayOfWeek.SUNDAY }, update: { enabled: false }, create: { day: DayOfWeek.SUNDAY, enabled: false } });

  for (const teacher of teachers.values()) {
    for (const day of weekdays) {
      for (const period of periods) {
        await prisma.teacherAvailability.upsert({
          where: { teacherId_day_periodId: { teacherId: teacher.id, day, periodId: period.id } },
          update: { status: AvailabilityStatus.AVAILABLE },
          create: { teacherId: teacher.id, day, periodId: period.id, status: AvailabilityStatus.AVAILABLE },
        });
      }
    }
  }
  for (const room of rooms) {
    for (const day of weekdays) {
      for (const period of periods) {
        await prisma.roomAvailability.upsert({
          where: { roomId_day_periodId: { roomId: room.id, day, periodId: period.id } },
          update: { status: AvailabilityStatus.AVAILABLE },
          create: { roomId: room.id, day, periodId: period.id, status: AvailabilityStatus.AVAILABLE },
        });
      }
    }
  }
  for (const section of sections) {
    for (const day of weekdays) {
      for (const period of periods) {
        await prisma.sectionAvailability.upsert({
          where: { sectionId_day_periodId: { sectionId: section.id, day, periodId: period.id } },
          update: { status: AvailabilityStatus.AVAILABLE },
          create: { sectionId: section.id, day, periodId: period.id, status: AvailabilityStatus.AVAILABLE },
        });
      }
    }
  }

  const [teacherCount, studentCount, sectionCount, subjectCount, roomCount, assignmentCount, seededClassSections] = await Promise.all([
    prisma.teacher.count(), prisma.student.count(), prisma.section.count(), prisma.subject.count(), prisma.room.count(), prisma.teacherAssignment.count(),
    prisma.section.findMany({ where: { id: { in: sections.map((section) => section.id) } }, include: { class: true, subjects: { include: { subject: true, assignments: true } } }, orderBy: { classId: "asc" } }),
  ]);
  const arjun = teachers.get("T-001");
  const physics = subjects.get("PHY");
  const arjunPhysicsSections = assignments.filter((assignment) => assignment.teacherId === arjun?.id && assignment.subjectId === physics?.id).map((assignment) => assignment.sectionId);
  const enabledWorkingDays = await prisma.workingDay.count({ where: { enabled: true } });
  const availablePeriodsPerClass = enabledWorkingDays * periods.length;
  const classReports = seededClassSections.map((section) => ({ className: section.class.name, totalRequired: section.subjects.reduce((total, item) => total + item.requiredWeeklyPeriods, 0), subjectRequirements: section.subjects.map((item) => ({ subject: item.subject.name, required: item.requiredWeeklyPeriods })), teacherAssignments: section.subjects.reduce((total, item) => total + item.assignments.length, 0), allSubjectsHaveTeachers: section.subjects.length === subjectData.length && section.subjects.every((item) => item.assignments.length > 0) }));
  const requiredClassNames = ["First Year Class A", "First Year Class B", "Second Year Class A", "Second Year Class B"];
  const allClasses = await prisma.class.findMany({ include: { sections: true } });
  const timetableEntryCount = await prisma.timetableEntry.count();
  const assignmentMatrix = sectionPlans.map((sectionPlan) => ({ className: sectionPlan.label, section: sectionPlan.section.name, assignments: sectionPlan.plan.map(([teacherCode, subjectCode]) => ({ teacher: teachers.get(teacherCode)?.name, subject: subjects.get(subjectCode)?.id ? subjectCode : subjectCode })) }));
  console.log(JSON.stringify({
    admin: admin.email,
    demoPassword: DEMO_PASSWORD,
    seeded: { teachers: teacherCount, students: studentCount, classes: classReports.length, sections: sectionCount, subjects: subjectCount, rooms: roomCount, teacherAssignments: assignmentCount },
    classReports,
    exactClassSet: allClasses.length === requiredClassNames.length && requiredClassNames.every((name) => allClasses.some((record) => record.name === name)),
    assignmentMatrix,
    totalRequiredPerClass: 42,
    overallRequiredPeriods: classReports.reduce((total, report) => total + report.totalRequired, 0),
    availablePeriodsPerClass,
    feasibleFor42Periods: availablePeriodsPerClass >= 42,
    arjunPhysicsSections,
    expectedSections: sections.map((section) => section.id),
    timetableEntriesCreatedBySeed: 0,
    existingTimetableEntriesPreserved: timetableEntryCount,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
