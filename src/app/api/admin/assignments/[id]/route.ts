import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, failure } from "@/lib/admin-api";
export async function DELETE(_request: Request, { params }: { params: { id: string } }) { const denied = await adminGuard(); if (denied) return denied; try { await prisma.teacherAssignment.delete({ where: { id: params.id } }); return NextResponse.json({ ok: true }); } catch (error) { return failure(error); } }
