import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";

// ----------------------------------------------
// projects/saasy/apps/web/lib/auth/utils.ts
//
// export function cn()                       L23
// export function isValidEmail()             L27
// export function errorCodeToCamelCase()     L36
// export function getLocalizedError()        L43
// error                                      L49
// localization                               L50
// localizeErrors                             L51
// export function getSearchParam()           L85
// export function getViewByPath()            L91
// export function getKeyByValue()            L99
// export function getPasswordSchema()       L106
// ----------------------------------------------

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets a localized error message from an error object
 */
export function getLocalizedError({
  error,
  localization,
  localizeErrors = true,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: ignore
  error: any;
  localization?: Partial<AuthLocalization>;
  localizeErrors: boolean;
}) {
  const DEFAULT_ERROR_MESSAGE = "Request failed";

  // If localization is disabled, return backend error message directly
  if (!localizeErrors) {
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;

    return DEFAULT_ERROR_MESSAGE;
  }

  if (typeof error === "string") {
    const key = error as string & keyof AuthLocalization;
    if (localization?.[key]) return localization[key];
  }

  if (error?.error) {
    if (error.error.code) {
      const errorCode = error.error.code as string & keyof AuthLocalization;
      if (localization?.[errorCode]) return localization[errorCode];
    }

    return (
      error.error.message ||
      error.error.code ||
      error.error.statusText ||
      localization?.REQUEST_FAILED
    );
  }

  return error?.message || localization?.REQUEST_FAILED || DEFAULT_ERROR_MESSAGE;
}

export function getSearchParam(paramName: string) {
  return typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get(paramName)
    : null;
}

export function getViewByPath<T extends Record<string, string>>(viewPaths: T, path?: string) {
  for (const [key, value] of Object.entries(viewPaths)) {
    if (value === path) {
      return key as keyof T;
    }
  }
}
