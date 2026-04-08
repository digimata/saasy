import { describe, expect, it } from "vitest";

import { decide } from "@/lib/auth/middleware";

// projects/saasy/apps/web/tests/unit/middleware-policy.test.ts
//

describe("decide", () => {
  it.each([
    {
      name: "redirects anonymous root requests to sign-in",
      input: { pathname: "/", hasSessionCookie: false },
      expected: { kind: "redirect", location: "/sign-in?redirectTo=%2F" },
    },
    {
      name: "preserves query params in anonymous protected redirects",
      input: { pathname: "/acme/billing", search: "?tab=usage", hasSessionCookie: false },
      expected: {
        kind: "redirect",
        location: "/sign-in?redirectTo=%2Facme%2Fbilling%3Ftab%3Dusage",
      },
    },
    {
      name: "redirects anonymous workspace-slugged paths to sign-in",
      input: { pathname: "/acme/settings", hasSessionCookie: false },
      expected: { kind: "redirect", location: "/sign-in?redirectTo=%2Facme%2Fsettings" },
    },
    {
      name: "redirects anonymous onboard requests to sign-in",
      input: { pathname: "/onboard", hasSessionCookie: false },
      expected: { kind: "redirect", location: "/sign-in?redirectTo=%2Fonboard" },
    },
    {
      name: "redirects anonymous invitation links to sign-in and preserves the invite URL",
      input: {
        pathname: "/accept-invitation",
        search: "?invitationId=inv_123&redirectTo=%2Fmembers",
        hasSessionCookie: false,
      },
      expected: {
        kind: "redirect",
        location:
          "/sign-in?redirectTo=%2Faccept-invitation%3FinvitationId%3Dinv_123%26redirectTo%3D%252Fmembers",
      },
    },
    {
      name: "allows anonymous sign-in entry",
      input: { pathname: "/sign-in", hasSessionCookie: false },
      expected: { kind: "allow" },
    },
    {
      name: "allows anonymous sign-up entry",
      input: { pathname: "/sign-up", hasSessionCookie: false },
      expected: { kind: "allow" },
    },
    {
      name: "allows sign-in when a session cookie is present",
      input: { pathname: "/sign-in", hasSessionCookie: true },
      expected: { kind: "allow" },
    },
    {
      name: "allows sign-up when a session cookie is present",
      input: { pathname: "/sign-up", hasSessionCookie: true },
      expected: { kind: "allow" },
    },
    {
      name: "allows onboard when a session cookie is present",
      input: { pathname: "/onboard", hasSessionCookie: true },
      expected: { kind: "allow" },
    },
    {
      name: "allows protected routes when a session cookie is present",
      input: { pathname: "/acme/members", hasSessionCookie: true },
      expected: { kind: "allow" },
    },
  ])("$name", ({ input, expected }) => {
    expect(decide(input)).toEqual(expected);
  });
});
