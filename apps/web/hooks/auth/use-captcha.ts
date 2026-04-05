"use client";

import type React from "react";

// Stub — captcha not enabled. Returns no-op values matching the real hook's interface.
export function useCaptcha(_opts?: Record<string, unknown>) {
  return {
    captcha: null as React.ReactNode,
    captchaRef: { current: null } as React.RefObject<unknown>,
    captchaState: null as string | null,
    resetCaptcha: () => {},
    getCaptchaHeaders: async (_action?: string) => ({}) as Record<string, string>,
  };
}
