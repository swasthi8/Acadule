import { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireStudent() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.STUDENT) return null;
  return session;
}
