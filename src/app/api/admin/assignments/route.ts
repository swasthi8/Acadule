import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

export async function GET() { const denied = await adminGuard(); if (denied) return denied; try { return NextResponse.json(await prisma.teacherAssignment.findMany({ include: { teacher: { include: { user: true } }, sectionSubject: { include: { section: true, subject: true } } } })); } catch (error) { return failure(error); } }
export async function POST(request: Request) {
  const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const teacherId = String(body?.teacherId ?? ""); const sectionId = String(body?.sectionId ?? ""); const subjectId = String(body?.subjectId ?? ""); const requiredWeeklyPeriods = Number(body?.requiredWeeklyPeriods);
  if (!teacherId || !sectionId || !subjectId || !Number.isInteger(requiredWeeklyPeriods) || requiredWeeklyPeriods < 1) return invalid("Teacher, section, subject, and weekly periods are required");
  try {
    const sectionSubject = await prisma.sectionSubject.upsert({ where: { sectionId_subjectId: { sectionId, subjectId } }, update: { requiredWeeklyPeriods }, create: { sectionId, subjectId, requiredWeeklyPeriods } });
    return NextResponse.json(await prisma.teacherAssignment.upsert({ where: { teacherId_sectionSubjectId: { teacherId, sectionSubjectId: sectionSubject.id } }, update: {}, create: { teacherId, sectionSubjectId: sectionSubject.id } }), { status: 201 });
  } catch (error) { return failure(error); }
}
