import { NextResponse } from "next/server";
import { AvailabilityStatus, DayOfWeek } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

const kinds = ["teacher", "room", "section"] as const;
type Kind = typeof kinds[number];

export async function POST(request: Request) {
  const denied = await adminGuard(); if (denied) return denied;
  const body = await bodyOf(request); const kind = String(body?.kind ?? "") as Kind; const entityId = String(body?.entityId ?? ""); const day = String(body?.day ?? "") as DayOfWeek; const periodId = String(body?.periodId ?? ""); const status = String(body?.status ?? "") as AvailabilityStatus;
  if (!kinds.includes(kind) || !entityId || !Object.values(DayOfWeek).includes(day) || !periodId || !Object.values(AvailabilityStatus).includes(status)) return invalid("Resource, day, period, and status are required");
  try {
    const data = { day, periodId, status };
    if (kind === "teacher") return NextResponse.json(await prisma.teacherAvailability.upsert({ where: { teacherId_day_periodId: { teacherId: entityId, day, periodId } }, update: data, create: { teacherId: entityId, ...data } }));
    if (kind === "room") return NextResponse.json(await prisma.roomAvailability.upsert({ where: { roomId_day_periodId: { roomId: entityId, day, periodId } }, update: data, create: { roomId: entityId, ...data } }));
    return NextResponse.json(await prisma.sectionAvailability.upsert({ where: { sectionId_day_periodId: { sectionId: entityId, day, periodId } }, update: data, create: { sectionId: entityId, ...data } }));
  } catch (error) { return failure(error); }
}
