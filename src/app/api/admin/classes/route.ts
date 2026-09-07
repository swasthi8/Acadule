import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, bodyOf, failure, invalid } from "@/lib/admin-api";

export async function GET() { const denied = await adminGuard(); if (denied) return denied; try { return NextResponse.json(await prisma.class.findMany({ include: { sections: true }, orderBy: { name: "asc" } })); } catch (error) { return failure(error); } }
export async function POST(request: Request) { const denied = await adminGuard(); if (denied) return denied; const body = await bodyOf(request); const name = String(body?.name ?? "").trim(); if (!name) return invalid("Class name is required"); try { return NextResponse.json(await prisma.class.create({ data: { name } }), { status: 201 }); } catch (error) { return failure(error); } }
