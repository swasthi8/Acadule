import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

export async function GET() {
  const denied = await adminGuard(); if (denied) return denied;
  try { return NextResponse.json(await prisma.teacher.findMany({ include: { user: true }, orderBy: { employeeCode: "asc" } })); } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  const denied = await adminGuard(); if (denied) return denied;
  const body = await bodyOf(request); const name = String(body?.name ?? "").trim(); const email = String(body?.email ?? "").trim().toLowerCase(); const employeeCode = String(body?.employeeCode ?? "").trim(); const password = String(body?.password ?? "");
  if (!name || !email || !employeeCode || password.length < 8) return invalid("Name, email, employee code, and an 8-character password are required");
  try { const teacher = await prisma.teacher.create({ data: { employeeCode, user: { create: { name, email, passwordHash: await hash(password, 12), role: "TEACHER" } } }, include: { user: true } }); return NextResponse.json(teacher, { status: 201 }); } catch (error) { return failure(error); }
}
