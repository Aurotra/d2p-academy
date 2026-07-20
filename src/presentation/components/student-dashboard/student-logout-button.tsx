"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/presentation/components/ui/button";
import { notifySessionChanged } from "@/shared/utils/session-events";

export function StudentLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/v1/auth/student-logout", { method: "POST" });
      notifySessionChanged();
      router.push("/student-login");
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="secondary" disabled={isLoading} onClick={handleLogout}>
      {isLoading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </Button>
  );
}
