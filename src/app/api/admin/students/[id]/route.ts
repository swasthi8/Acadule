import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
	const denied = await adminGuard(); if (denied) return denied;
	const body = await bodyOf(request); const name = String(body?.name ?? "").trim(); const email = String(body?.email ?? "").trim().toLowerCase(); const studentCode = String(body?.studentCode ?? "").trim(); const sectionId = String(body?.sectionId ?? "");
	if (!name || !email || !studentCode || !sectionId) return invalid("Name, email, student code, and section are required");
	try {
		const existing = await prisma.student.findUnique({ where: { id: params.id }, select: { userId: true } });
		if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });
		const password = String(body?.password ?? "");
		const student = await prisma.$transaction(async (transaction) => {
			await transaction.user.update({ where: { id: existing.userId }, data: { name, email, ...(password.length >= 8 ? { passwordHash: await hash(password, 12) } : {}) } });
			return transaction.student.update({ where: { id: params.id }, data: { studentCode, sectionId }, include: { user: true, section: true } });
		});
		return NextResponse.json(student);
	} catch (error) { return failure(error); }
}
export async function DELETE(_request: Request, { params }: { params: { id: string } }) { const denied = await adminGuard(); if (denied) return denied; try { await prisma.student.delete({ where: { id: params.id } }); return NextResponse.json({ ok: true }); } catch (error) { return failure(error); } }
