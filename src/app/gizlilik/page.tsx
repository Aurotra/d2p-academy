import { redirect } from "next/navigation";

import { LEGAL_PATHS } from "@/shared/constants/company";

/** Kept so old bookmarks resolve; next.config also redirects permanently. */
export default function PrivacyLegacyPage() {
  redirect(LEGAL_PATHS.privacy);
}
