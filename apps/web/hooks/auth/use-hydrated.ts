import { useSyncExternalStore } from "react";

// --------------------------------------
// projects/saasy/apps/web/hooks/auth/use-hydrated.ts
//
// function subscribe()               L10
// export function useIsHydrated()    L14
// --------------------------------------

function subscribe() {
  return () => {};
}

export function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
