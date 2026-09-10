import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

export async function PATCH(request: Request) {
  const session = await requireTeacher();
  if (!session) return NextResponse.json({ error: "Teacher access required" }, { status: 403 });

  const body = await request.json().catch(() => null) as { isAvailable?: unknown } | null;
  if (typeof body?.isAvailable !== "boolean") return NextResponse.json({ error: "isAvailable must be a boolean" }, { status: 400 });

  const teacher = await prisma.teacher.update({
    where: { userId: session.user.id },
    data: { isAvailable: body.isAvailable },
    select: { isAvailable: true },
  });

  return NextResponse.json(teacher);
}