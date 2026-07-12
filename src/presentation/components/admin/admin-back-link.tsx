"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminBackLink() {
  const pathname = usePathname();

  if (pathname === "/admin") {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="mb-4 inline-flex items-center text-sm font-semibold text-document-primary transition hover:text-document-primary-hover hover:underline"
    >
      ← Admin Paneline Dön
    </Link>
  );
}
