import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard, failure } from "@/lib/admin-api";
export async function GET() { const denied = await adminGuard(); if (denied) return denied; try { return NextResponse.json(await prisma.sectionSubject.findMany({ include: { section: { include: { class: true } }, subject: true, assignments: true } })); } catch (error) { return failure(error); } }
