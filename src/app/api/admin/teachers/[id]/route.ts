import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const name = String(body?.name ?? "").trim(); const email = String(body?.email ?? "").trim().toLowerCase(); const employeeCode = String(body?.employeeCode ?? "").trim();
  if (!name || !email || !employeeCode) return invalid("Name, email, and employee code are required");
  try { const teacher = await prisma.teacher.update({ where: { id: params.id }, data: { employeeCode, user: { update: { name, email, ...(String(body?.password ?? "").length >= 8 ? { passwordHash: await hash(String(body?.password), 12) } : {}) } } }, include: { user: true } }); return NextResponse.json(teacher); } catch (error) { return failure(error); }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const denied = await adminGuard(); if (denied) return denied;
  try { await prisma.teacher.delete({ where: { id: params.id } }); return NextResponse.json({ ok: true }); } catch (error) { return failure(error); }
}
