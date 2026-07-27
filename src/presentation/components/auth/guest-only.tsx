"use client";

import type { ReactNode } from "react";

import { useSiteAuth } from "@/presentation/providers/site-auth-provider";

interface GuestOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function GuestOnly({ children, fallback = null }: GuestOnlyProps) {
  const { isAuthResolved, isLoggedIn } = useSiteAuth();

  if (!isAuthResolved) {
    return fallback;
  }

  if (isLoggedIn) {
    return null;
  }

  return children;
}
