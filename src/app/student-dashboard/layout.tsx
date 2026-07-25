import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NO_INDEX_METADATA } from "@/shared/seo/metadata";

export const metadata: Metadata = NO_INDEX_METADATA;

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
