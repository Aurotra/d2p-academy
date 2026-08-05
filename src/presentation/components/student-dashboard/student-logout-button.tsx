"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/presentation/components/ui/button";
import { performSiteSignOut } from "@/shared/utils/perform-site-sign-out";

export function StudentLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await performSiteSignOut("student");
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
