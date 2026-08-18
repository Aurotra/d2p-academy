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
import { profileHasInstructorCapability } from "@/infrastructure/auth/instructor-capability";
import { buildContentSecurityPolicy } from "@/shared/config/security-headers";
import { createCspNonce, CSP_NONCE_HEADER } from "@/shared/config/csp-nonce";
import { isInstructorAppPath, resolvePostLoginPath } from "@/shared/utils/auth-redirect";

function finalizeResponse(
  request: NextRequest,
  response: NextResponse,
  nonce: string,
): NextResponse {
  const csp = buildContentSecurityPolicy(nonce);

  if (response.status >= 300 && response.status < 400) {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.forEach((value, key) => {
    nextResponse.headers.set(key, value);
  });
  response.cookies.getAll().forEach((cookie) => {
    nextResponse.cookies.set(cookie);
  });

  nextResponse.headers.set("Content-Security-Policy", csp);
  return nextResponse;
}

function redirect(request: NextRequest, url: URL | string, nonce: string): NextResponse {
  return finalizeResponse(request, NextResponse.redirect(url), nonce);
}

function isAuthProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/student-dashboard") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/instructor-login"
  );
}

async function handleAuthMiddleware(
  request: NextRequest,
  nonce: string,
): Promise<NextResponse> {
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
      return finalizeResponse(request, response, nonce);
    }

    return finalizeResponse(request, NextResponse.next(), nonce);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return finalizeResponse(request, NextResponse.next(), nonce);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, nonce);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isInstructorAppPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/instructor-login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return redirect(request, loginUrl, nonce);
  }

  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return redirect(request, loginUrl, nonce);
  }

  let profileRole: string | null = null;
  let profileIsInstructor = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_instructor")
      .eq("id", user.id)
      .single();
    profileRole = profile?.role ?? null;
    profileIsInstructor = profileHasInstructorCapability({
      role: profileRole ?? "",
      is_instructor: profile?.is_instructor,
    });
  }

  if (user && pathname.startsWith("/admin")) {
    if (profileRole !== "admin") {
      return redirect(request, new URL("/dashboard", request.url), nonce);
    }
  }

  if (user && isInstructorAppPath(pathname)) {
    if (!profileIsInstructor) {
      return redirect(request, new URL("/dashboard", request.url), nonce);
    }
  }

  if (user && pathname === "/instructor-login" && profileIsInstructor) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const safeRedirect =
      redirectTo && isInstructorAppPath(redirectTo) ? redirectTo : "/instructor";
    return redirect(request, new URL(safeRedirect, request.url), nonce);
  }

  if (user && pathname === "/dashboard" && profileRole === "instructor") {
    return redirect(request, new URL("/instructor", request.url), nonce);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const defaultPath =
      profileRole === "admin"
        ? "/admin"
        : profileRole === "instructor"
          ? "/instructor"
          : profileIsInstructor && profileRole !== "parent" && profileRole !== "student"
            ? "/instructor"
            : "/dashboard";
    const safeRedirect = resolvePostLoginPath({
      requestedPath: request.nextUrl.searchParams.get("redirectTo"),
      isInstructor: profileIsInstructor,
      defaultRedirect: defaultPath,
      portal: "parent",
    });
    return redirect(request, new URL(safeRedirect, request.url), nonce);
  }

  supabaseResponse.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  const nonce = createCspNonce();

  if (isAuthProtectedPath(request.nextUrl.pathname)) {
    return handleAuthMiddleware(request, nonce);
  }

  return finalizeResponse(request, NextResponse.next(), nonce);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    },
  ],
};
