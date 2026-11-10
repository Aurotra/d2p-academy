"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ACTIVATION_UPDATED_EVENT,
  type ActivatedKitsMap,
  readActivatedKits,
} from "@/lib/store/activation";

export function useActivatedKits() {
  const [kits, setKits] = useState<ActivatedKitsMap>({});
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setKits(readActivatedKits());
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === "d2p_activated_kits") {
        refresh();
      }
    }

    window.addEventListener(ACTIVATION_UPDATED_EVENT, refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(ACTIVATION_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return { kits, hydrated, refresh };
}
