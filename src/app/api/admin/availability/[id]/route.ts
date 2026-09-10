import { NextResponse } from "next/server";
import { AvailabilityStatus, DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

const kinds = ["teacher", "room", "section"] as const;
type Kind = typeof kinds[number];

function inputOf(body: Record<string, unknown> | null) {
  const kind = String(body?.kind ?? "") as Kind;
  const entityId = String(body?.entityId ?? "");
  const day = String(body?.day ?? "") as DayOfWeek;
  const periodId = String(body?.periodId ?? "");
  const status = String(body?.status ?? "") as AvailabilityStatus;
  if (!kinds.includes(kind) || !entityId || !Object.values(DayOfWeek).includes(day) || !periodId || !Object.values(AvailabilityStatus).includes(status)) return null;
  return { kind, entityId, day, periodId, status };
}

async function exists(kind: Kind, entityId: string, periodId: string) {
  const [resource, period] = await Promise.all([
    kind === "teacher" ? prisma.teacher.findUnique({ where: { id: entityId }, select: { id: true } }) : kind === "room" ? prisma.room.findUnique({ where: { id: entityId }, select: { id: true } }) : prisma.section.findUnique({ where: { id: entityId }, select: { id: true } }),
    prisma.period.findUnique({ where: { id: periodId }, select: { id: true } }),
  ]);
  return Boolean(resource && period);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = await adminGuard(); if (denied) return denied;
  const input = inputOf(await bodyOf(request));
  if (!input) return invalid("Resource, day, period, and status are required");
  try {
    if (!(await exists(input.kind, input.entityId, input.periodId))) return invalid("The selected resource or period does not exist");
    const data = { day: input.day, periodId: input.periodId, status: input.status };
    const result = input.kind === "teacher" ? await prisma.teacherAvailability.update({ where: { id: params.id }, data: { teacherId: input.entityId, ...data } }) : input.kind === "room" ? await prisma.roomAvailability.update({ where: { id: params.id }, data: { roomId: input.entityId, ...data } }) : await prisma.sectionAvailability.update({ where: { id: params.id }, data: { sectionId: input.entityId, ...data } });
    return NextResponse.json(result);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A condition already exists for this resource, day, and period" }, { status: 409 });
    return failure(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const denied = await adminGuard(); if (denied) return denied;
  try {
    const deleted = await Promise.allSettled([
      prisma.teacherAvailability.delete({ where: { id: params.id } }),
      prisma.roomAvailability.delete({ where: { id: params.id } }),
      prisma.sectionAvailability.delete({ where: { id: params.id } }),
    ]);
    if (!deleted.some((result) => result.status === "fulfilled")) return NextResponse.json({ error: "Availability condition not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}