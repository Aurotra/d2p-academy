"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/presentation/components/ui/button";
import { performSiteSignOut } from "@/shared/utils/perform-site-sign-out";

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
}

export function LogoutButton({ className = "", variant = "outline" }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await performSiteSignOut("email");
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <Button variant={variant} className={className} disabled={isLoading} onClick={handleLogout}>
      {isLoading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </Button>
  );
}
