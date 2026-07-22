import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";

import {
  STUDENT_SESSION_COOKIE,
  verifyStudentSession,
} from "@/infrastructure/auth/student-jwt";
import {
  clearStudentSessionCookie,
  validateStudentSessionAgainstDb,
} from "@/infrastructure/auth/validate-student-session-edge";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/student-dashboard")) {
    const token = request.cookies.get(STUDENT_SESSION_COOKIE)?.value;
    const payload = token ? await verifyStudentSession(token) : null;
    const valid = payload ? await validateStudentSessionAgainstDb(payload) : false;

    if (!valid) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/student-login";
      loginUrl.searchParams.set("redirectTo", pathname);
      const response = NextResponse.redirect(loginUrl);
      clearStudentSessionCookie(response);
      return response;
    }

    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && pathname.startsWith("/instructor")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/instructor-login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let profileRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    profileRole = profile?.role ?? null;
  }

  if (user && pathname.startsWith("/admin")) {
    if (profileRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (user && pathname.startsWith("/instructor")) {
    if (profileRole !== "instructor") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (user && pathname === "/instructor-login") {
    if (profileRole === "instructor") {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      const safeRedirect =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : "/instructor";
      return NextResponse.redirect(new URL(safeRedirect, request.url));
    }
    if (profileRole === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (user && pathname === "/dashboard" && profileRole === "instructor") {
    return NextResponse.redirect(new URL("/instructor", request.url));
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const defaultPath =
      profileRole === "admin"
        ? "/admin"
        : profileRole === "instructor"
          ? "/instructor"
          : "/dashboard";
    const safeRedirect =
      redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : defaultPath;
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/instructor",
    "/instructor/:path*",
    "/instructor-login",
    "/login",
    "/register",
    "/student-dashboard",
    "/student-dashboard/:path*",
  ],
};
