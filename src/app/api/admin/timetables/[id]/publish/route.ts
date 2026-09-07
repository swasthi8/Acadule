import { NextResponse } from "next/server";
import { TimetableStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard, failure } from "@/lib/admin-api";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const denied = await adminGuard(); if (denied) return denied;
  try {
    const timetable = await prisma.timetable.findUnique({ where: { id: params.id }, select: { status: true } });
    if (!timetable) return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    if (timetable.status !== TimetableStatus.VALIDATED) return NextResponse.json({ error: "Validate the timetable before publishing" }, { status: 422 });
    return NextResponse.json(await prisma.timetable.update({ where: { id: params.id }, data: { status: TimetableStatus.PUBLISHED, publishedAt: new Date() } }));
  } catch (error) { return failure(error); }
}
