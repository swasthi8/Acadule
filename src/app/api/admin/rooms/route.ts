import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";
export async function GET() { const denied = await adminGuard(); if (denied) return denied; try { return NextResponse.json(await prisma.room.findMany({ orderBy: { name: "asc" } })); } catch (error) { return failure(error); } }
export async function POST(request: Request) { const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const name = String(body?.name ?? "").trim(); const capacity = Number(body?.capacity); if (!name || !Number.isInteger(capacity) || capacity < 1) return invalid("Room name and a positive capacity are required"); try { return NextResponse.json(await prisma.room.create({ data: { name, capacity } }), { status: 201 }); } catch (error) { return failure(error); } }
