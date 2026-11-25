"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/instructor", label: "Etkinliklerim", match: (path: string) => path === "/instructor" },
  {
    href: "/instructor/presentations",
    label: "Sunumlarım",
    match: (path: string) => path.startsWith("/instructor/presentations"),
  },
] as const;

export function InstructorNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Eğitmen menü">
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex min-h-10 items-center justify-center rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-white shadow-sm ring-2 ring-secondary/30"
                : "inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-secondary/40 bg-white px-4 py-2 text-sm font-bold text-secondary transition hover:border-secondary hover:bg-secondary/10"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
