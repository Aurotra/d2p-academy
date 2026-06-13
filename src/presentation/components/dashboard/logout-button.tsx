"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/presentation/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Çıkış yapılamadı.");
      }

      router.push("/login");
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
