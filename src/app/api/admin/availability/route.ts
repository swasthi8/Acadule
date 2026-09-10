import { NextResponse } from "next/server";
import { AvailabilityStatus, DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

const kinds = ["teacher", "room", "section"] as const;
type Kind = typeof kinds[number];

function parseBody(body: Record<string, unknown> | null) {
  const kind = String(body?.kind ?? "") as Kind;
  const entityId = String(body?.entityId ?? "");
  const day = String(body?.day ?? "") as DayOfWeek;
  const periodId = String(body?.periodId ?? "");
  const status = String(body?.status ?? "") as AvailabilityStatus;
  if (!kinds.includes(kind) || !entityId || !Object.values(DayOfWeek).includes(day) || !periodId || !Object.values(AvailabilityStatus).includes(status)) return null;
  return { kind, entityId, day, periodId, status };
}

async function validateResource(kind: Kind, entityId: string, periodId: string) {
  const [resource, period] = await Promise.all([
    kind === "teacher" ? prisma.teacher.findUnique({ where: { id: entityId }, select: { id: true } }) : kind === "room" ? prisma.room.findUnique({ where: { id: entityId }, select: { id: true } }) : prisma.section.findUnique({ where: { id: entityId }, select: { id: true } }),
    prisma.period.findUnique({ where: { id: periodId }, select: { id: true } }),
  ]);
  return resource && period;
}

export async function GET() {
  const denied = await adminGuard(); if (denied) return denied;
  try {
    const [teachers, rooms, sections] = await Promise.all([
      prisma.teacherAvailability.findMany({ include: { teacher: { include: { user: true } }, period: true }, orderBy: [{ day: "asc" }, { period: { periodNumber: "asc" } }] }),
      prisma.roomAvailability.findMany({ include: { room: true, period: true }, orderBy: [{ day: "asc" }, { period: { periodNumber: "asc" } }] }),
      prisma.sectionAvailability.findMany({ include: { section: { include: { class: true } }, period: true }, orderBy: [{ day: "asc" }, { period: { periodNumber: "asc" } }] }),
    ]);
    return NextResponse.json([
      ...teachers.map((item) => ({ id: item.id, kind: "teacher", entityId: item.teacherId, resourceName: item.teacher.user.name ?? item.teacher.employeeCode, day: item.day, periodId: item.periodId, periodNumber: item.period.periodNumber, startTime: item.period.startTime, status: item.status })),
      ...rooms.map((item) => ({ id: item.id, kind: "room", entityId: item.roomId, resourceName: item.room.name, day: item.day, periodId: item.periodId, periodNumber: item.period.periodNumber, startTime: item.period.startTime, status: item.status })),
      ...sections.map((item) => ({ id: item.id, kind: "section", entityId: item.sectionId, resourceName: `${item.section.class.name} / ${item.section.name}`, day: item.day, periodId: item.periodId, periodNumber: item.period.periodNumber, startTime: item.period.startTime, status: item.status })),
    ]);
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  const denied = await adminGuard(); if (denied) return denied;
  const input = parseBody(await bodyOf(request));
  if (!input) return invalid("Resource, day, period, and status are required");
  try {
    if (!(await validateResource(input.kind, input.entityId, input.periodId))) return invalid("The selected resource or period does not exist");
    const data = { day: input.day, periodId: input.periodId, status: input.status };
    const result = input.kind === "teacher"
      ? await prisma.teacherAvailability.upsert({ where: { teacherId_day_periodId: { teacherId: input.entityId, day: input.day, periodId: input.periodId } }, update: { status: input.status }, create: { teacherId: input.entityId, ...data } })
      : input.kind === "room"
      ? await prisma.roomAvailability.upsert({ where: { roomId_day_periodId: { roomId: input.entityId, day: input.day, periodId: input.periodId } }, update: { status: input.status }, create: { roomId: input.entityId, ...data } })
      : await prisma.sectionAvailability.upsert({ where: { sectionId_day_periodId: { sectionId: input.entityId, day: input.day, periodId: input.periodId } }, update: { status: input.status }, create: { sectionId: input.entityId, ...data } });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A condition already exists for this resource, day, and period" }, { status: 409 });
    return failure(error);
  }
}
