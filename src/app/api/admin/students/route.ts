import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

export async function GET() { const denied = await adminGuard(); if (denied) return denied; try { return NextResponse.json(await prisma.student.findMany({ include: { user: true, section: { include: { class: true } } }, orderBy: { studentCode: "asc" } })); } catch (error) { return failure(error); } }
export async function POST(request: Request) {
  const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const name = String(body?.name ?? "").trim(); const email = String(body?.email ?? "").trim().toLowerCase(); const studentCode = String(body?.studentCode ?? "").trim(); const sectionId = String(body?.sectionId ?? ""); const password = String(body?.password ?? "");
  if (!name || !email || !studentCode || !sectionId || password.length < 8) return invalid("Name, email, student code, section, and an 8-character password are required");
  try {
    const student = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({ data: { name, email, passwordHash: await hash(password, 12), role: Role.STUDENT } });
      return transaction.student.create({ data: { userId: user.id, studentCode, sectionId }, include: { user: true, section: true } });
    });
    return NextResponse.json(student, { status: 201 });
  } catch (error) { return failure(error); }
}
