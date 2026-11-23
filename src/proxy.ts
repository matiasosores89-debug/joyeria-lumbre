import { NextRequest, NextResponse } from "next/server";
import { cookieSesion, verificarSesion } from "@/auth/cookie";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") return NextResponse.next();
  const token = request.cookies.get(cookieSesion)?.value;
  return await verificarSesion(token) ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"] };
