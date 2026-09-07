import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";
export async function GET() { const denied = await adminGuard(); if (denied) return denied; try { return NextResponse.json(await prisma.section.findMany({ include: { class: true }, orderBy: { name: "asc" } })); } catch (error) { return failure(error); } }
export async function POST(request: Request) { const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const classId = String(body?.classId ?? ""); const name = String(body?.name ?? "").trim(); const capacity = Number(body?.capacity); if (!classId || !name || !Number.isInteger(capacity) || capacity < 1) return invalid("Class, section name, and a positive capacity are required"); try { return NextResponse.json(await prisma.section.create({ data: { classId, name, capacity } }), { status: 201 }); } catch (error) { return failure(error); } }
