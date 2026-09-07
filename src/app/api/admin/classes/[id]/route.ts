import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";
export async function PATCH(request: Request, { params }: { params: { id: string } }) { const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const name = String(body?.name ?? "").trim(); if (!name) return invalid("Class name is required"); try { return NextResponse.json(await prisma.class.update({ where: { id: params.id }, data: { name } })); } catch (error) { return failure(error); } }
export async function DELETE(_request: Request, { params }: { params: { id: string } }) { const denied = await adminGuard(); if (denied) return denied; try { await prisma.class.delete({ where: { id: params.id } }); return NextResponse.json({ ok: true }); } catch (error) { return failure(error); } }
