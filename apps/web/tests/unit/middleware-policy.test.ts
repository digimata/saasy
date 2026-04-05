import { describe, expect, it } from "vitest";

import { evaluateMiddlewarePolicy } from "@/lib/auth/middleware-policy";

// -------------------------------------------------------------
// projects/saasy/apps/web/tests/unit/middleware-policy.test.ts
//
// describe("evaluateMiddlewarePolicy")    L10
// -------------------------------------------------------------

describe("evaluateMiddlewarePolicy", () => {
  it.each([
    {
      name: "redirects anonymous root requests to sign-in",
      input: { pathname: "/", hasSessionCookie: false },
      expected: { kind: "redirect", location: "/sign-in?redirectTo=%2F" },
    },
    {
      name: "preserves query params in anonymous protected redirects",
      input: { pathname: "/billing", search: "?tab=usage", hasSessionCookie: false },
      expected: {
        kind: "redirect",
        location: "/sign-in?redirectTo=%2Fbilling%3Ftab%3Dusage",
      },
    },
    {
      name: "redirects anonymous setup requests to sign-in",
      input: { pathname: "/setup", hasSessionCookie: false },
      expected: { kind: "redirect", location: "/sign-in?redirectTo=%2Fsetup" },
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
      name: "allows setup when a session cookie is present",
      input: { pathname: "/setup", hasSessionCookie: true },
      expected: { kind: "allow" },
    },
    {
      name: "allows protected routes when a session cookie is present",
      input: { pathname: "/members", hasSessionCookie: true },
      expected: { kind: "allow" },
    },
  ])("$name", ({ input, expected }) => {
    expect(evaluateMiddlewarePolicy(input)).toEqual(expected);
  });
});
