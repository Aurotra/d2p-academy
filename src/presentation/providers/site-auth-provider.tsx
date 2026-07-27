"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { profileHasInstructorCapability } from "@/infrastructure/auth/instructor-capability";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/create-browser-client";
import { SESSION_CHANGED_EVENT } from "@/shared/utils/session-events";

export type SiteSessionKind = "email" | "student";

interface SiteAuthContextValue {
  isAuthResolved: boolean;
  isLoggedIn: boolean;
  sessionKind: SiteSessionKind | null;
  userDisplayName: string | null;
  userRole: string | null;
  isInstructor: boolean;
  panelHref: string;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
}

const SiteAuthContext = createContext<SiteAuthContextValue | null>(null);

export function SiteAuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [sessionKind, setSessionKind] = useState<SiteSessionKind | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);

  const clearSession = useCallback(() => {
    setSessionKind(null);
    setUserDisplayName(null);
    setUserRole(null);
    setIsInstructor(false);
  }, []);

  const refreshSession = useCallback(async () => {
    const client = createSupabaseBrowserClient();

    async function resolveDisplayName(userId: string, fallback?: string | null) {
      if (!client) {
        return;
      }

      const { data } = await client
        .from("profiles")
        .select("full_name, role, is_instructor")
        .eq("id", userId)
        .maybeSingle();

      const name = data?.full_name?.trim() || fallback?.trim() || null;
      setUserDisplayName(name);
      setUserRole(data?.role ?? null);
      setIsInstructor(data ? profileHasInstructorCapability(data) : false);
    }

    async function probeStudentSession() {
      try {
        const response = await fetch("/api/v1/auth/student-session");
        const payload = (await response.json()) as {
          data?: { authenticated?: boolean; fullName?: string; username?: string };
        };
        if (payload.data?.authenticated) {
          setSessionKind("student");
          setUserDisplayName(
            payload.data.fullName?.trim() ||
              (payload.data.username ? `@${payload.data.username}` : null),
          );
          setUserRole("student");
          setIsInstructor(false);
          return;
        }
      } catch {
        // ignore
      }

      clearSession();
    }

    if (!client) {
      await probeStudentSession();
      setIsAuthResolved(true);
      return;
    }

    const { data } = await client.auth.getUser();
    const user = data.user;

    if (user) {
      setSessionKind("email");
      const metadataName =
        typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
      await resolveDisplayName(user.id, metadataName);
      setIsAuthResolved(true);
      return;
    }

    await probeStudentSession();
    setIsAuthResolved(true);
  }, [clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    function handleSessionChanged() {
      void refreshSession();
    }

    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
  }, [refreshSession]);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) {
      return;
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      void refreshSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const panelHref = useMemo(() => {
    if (sessionKind === "student") {
      return "/student-dashboard";
    }

    if (userRole === "admin") {
      return "/admin";
    }

    if (
      userRole === "instructor" ||
      (isInstructor && userRole !== "parent" && userRole !== "student")
    ) {
      return "/instructor";
    }

    return "/dashboard";
  }, [sessionKind, userRole, isInstructor]);

  const value = useMemo<SiteAuthContextValue>(
    () => ({
      isAuthResolved,
      isLoggedIn: sessionKind !== null,
      sessionKind,
      userDisplayName,
      userRole,
      isInstructor,
      panelHref,
      refreshSession,
      clearSession,
    }),
    [
      isAuthResolved,
      sessionKind,
      userDisplayName,
      userRole,
      isInstructor,
      panelHref,
      refreshSession,
      clearSession,
    ],
  );

  return <SiteAuthContext.Provider value={value}>{children}</SiteAuthContext.Provider>;
}

export function useSiteAuth(): SiteAuthContextValue {
  const context = useContext(SiteAuthContext);
  if (!context) {
    throw new Error("useSiteAuth must be used within SiteAuthProvider.");
  }
  return context;
}
