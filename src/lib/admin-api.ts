import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function adminGuard() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  return null;
}

export async function bodyOf(request: Request) {
  try { return await request.json() as Record<string, unknown>; } catch { return null; }
}

export function invalid(message: string) { return NextResponse.json({ error: message }, { status: 400 }); }
export function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  return NextResponse.json({ error: message }, { status: 500 });
}
