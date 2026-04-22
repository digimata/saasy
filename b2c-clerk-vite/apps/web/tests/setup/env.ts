import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "pk_test_saasy");
