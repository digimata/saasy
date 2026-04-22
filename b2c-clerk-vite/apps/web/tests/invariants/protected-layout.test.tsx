import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

const clerk_state = vi.hoisted(() => ({
  signed_in: false,
}));

vi.mock("@clerk/clerk-react", () => ({
  SignedIn: ({ children }: { children: unknown }) =>
    clerk_state.signed_in ? <>{children}</> : null,
  SignedOut: ({ children }: { children: unknown }) =>
    clerk_state.signed_in ? null : <>{children}</>,
  RedirectToSignIn: () => <div>redirect-to-sign-in</div>,
}));

vi.mock("@/components/app-layout", () => ({
  AppLayout: ({ children }: { children: unknown }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

import ProtectedLayout from "@/app/(app)/layout";

describe("session invariants", () => {
  beforeEach(() => {
    clerk_state.signed_in = false;
  });

  it("INV-SES-001 redirects anonymous users away from protected app routes", () => {
    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route path="/projects" element={<div>Projects page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("redirect-to-sign-in")).toBeTruthy();
    expect(screen.queryByText("Projects page")).toBeNull();
  });

  it("INV-SES-001 renders protected content only for signed-in users", () => {
    clerk_state.signed_in = true;

    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <Routes>
          <Route element={<ProtectedLayout />}>
            <Route path="/projects" element={<div>Projects page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("app-layout")).toBeTruthy();
    expect(screen.getByText("Projects page")).toBeTruthy();
    expect(screen.queryByText("redirect-to-sign-in")).toBeNull();
  });
});
