import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";
export async function PATCH(request: Request, { params }: { params: { id: string } }) { const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const code = String(body?.code ?? "").trim().toUpperCase(); const name = String(body?.name ?? "").trim(); if (!code || !name) return invalid("Subject code and name are required"); try { return NextResponse.json(await prisma.subject.update({ where: { id: params.id }, data: { code, name } })); } catch (error) { return failure(error); } }
export async function DELETE(_request: Request, { params }: { params: { id: string } }) { const denied = await adminGuard(); if (denied) return denied; try { await prisma.subject.delete({ where: { id: params.id } }); return NextResponse.json({ ok: true }); } catch (error) { return failure(error); } }
