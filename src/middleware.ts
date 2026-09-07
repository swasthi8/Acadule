import { auth } from "@/auth";

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
