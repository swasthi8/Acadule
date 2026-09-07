import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, failure } from "@/lib/admin-api";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const denied = await adminGuard();
  if (denied) return denied;

  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id: params.id },
      select: { id: true, version: true, status: true, _count: { select: { entries: true } } },
    });
    if (!timetable) return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    await prisma.$transaction(async (transaction) => {
      await transaction.timetableEntry.deleteMany({ where: { timetableId: timetable.id } });
      await transaction.timetable.delete({ where: { id: timetable.id } });
    });

    return NextResponse.json({ ok: true, version: timetable.version, status: timetable.status, entries: timetable._count.entries });
  } catch (error) {
    return failure(error);
  }
}
