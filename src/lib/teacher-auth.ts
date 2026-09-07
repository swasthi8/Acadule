import { Role } from "@prisma/client";
import { auth } from "@/auth";

export async function requireTeacher() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.TEACHER) return null;
  return session;
}
