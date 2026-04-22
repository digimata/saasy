import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router_state = vi.hoisted(() => ({
  redirect_to: "/",
  navigate: vi.fn(),
}));

const clerk_state = vi.hoisted(() => ({
  sign_in_loaded: true,
  sign_up_loaded: true,
  sign_in: {
    create: vi.fn(),
    attemptFirstFactor: vi.fn(),
    authenticateWithRedirect: vi.fn(),
  },
  sign_up: {
    create: vi.fn(),
    prepareEmailAddressVerification: vi.fn(),
    attemptEmailAddressVerification: vi.fn(),
  },
  set_active_sign_in: vi.fn(),
  set_active_sign_up: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>(
    "react-router",
  );

  return {
    ...actual,
    useNavigate: () => router_state.navigate,
    useSearchParams: () => {
      const params = new URLSearchParams();
      if (router_state.redirect_to) {
        params.set("redirectTo", router_state.redirect_to);
      }

      return [params] as const;
    },
  };
});

vi.mock("@clerk/clerk-react", () => ({
  useSignIn: () => ({
    isLoaded: clerk_state.sign_in_loaded,
    signIn: clerk_state.sign_in,
    setActive: clerk_state.set_active_sign_in,
  }),
  useSignUp: () => ({
    isLoaded: clerk_state.sign_up_loaded,
    signUp: clerk_state.sign_up,
    setActive: clerk_state.set_active_sign_up,
  }),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: unknown }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/input-bubble", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    InputBubble: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (props, ref) => <input ref={ref} {...props} />,
    ),
  };
});

vi.mock("@/components/ui/input-otp", () => ({
  InputOTP: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
    <input
      aria-label="verification-code"
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
  InputOTPGroup: ({ children }: { children: unknown }) => <div>{children}</div>,
  InputOTPSlot: () => <span data-testid="otp-slot" />,
}));

vi.mock("@/components/logo", () => ({
  Logo: () => <div>Logo</div>,
}));

vi.mock("@/components/ui/icons", () => ({
  IconArrowRight: () => <span>ArrowRight</span>,
  IconChevronLeftSmall: () => <span>Back</span>,
  IconGoogle: () => <span>Google</span>,
  IconGitHub: () => <span>GitHub</span>,
  IconLinkedIn: () => <span>LinkedIn</span>,
}));

import SignInPage from "@/app/(auth)/sign-in/page";

describe("sign-in invariants", () => {
  beforeEach(() => {
    router_state.redirect_to = "/";
    router_state.navigate.mockReset();

    clerk_state.sign_in_loaded = true;
    clerk_state.sign_up_loaded = true;

    clerk_state.sign_in.create.mockReset();
    clerk_state.sign_in.create.mockResolvedValue({});
    clerk_state.sign_in.attemptFirstFactor.mockReset();
    clerk_state.sign_in.attemptFirstFactor.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_sign_in",
    });
    clerk_state.sign_in.authenticateWithRedirect.mockReset();
    clerk_state.sign_in.authenticateWithRedirect.mockResolvedValue(undefined);

    clerk_state.sign_up.create.mockReset();
    clerk_state.sign_up.create.mockResolvedValue({});
    clerk_state.sign_up.prepareEmailAddressVerification.mockReset();
    clerk_state.sign_up.prepareEmailAddressVerification.mockResolvedValue(
      undefined,
    );
    clerk_state.sign_up.attemptEmailAddressVerification.mockReset();
    clerk_state.sign_up.attemptEmailAddressVerification.mockResolvedValue({
      status: "complete",
      createdSessionId: "sess_sign_up",
    });

    clerk_state.set_active_sign_in.mockReset();
    clerk_state.set_active_sign_in.mockResolvedValue(undefined);
    clerk_state.set_active_sign_up.mockReset();
    clerk_state.set_active_sign_up.mockResolvedValue(undefined);
  });

  it("INV-SES-002 preserves same-app redirects through email-code sign-in", async () => {
    router_state.redirect_to = "/settings?tab=billing";

    render(<SignInPage />);

    const email_input = screen.getByPlaceholderText(
      "Enter your email address...",
    );

    fireEvent.change(email_input, { target: { value: "user@example.com" } });
    fireEvent.submit(email_input.closest("form")!);

    await waitFor(() => {
      expect(clerk_state.sign_in.create).toHaveBeenCalledWith({
        identifier: "user@example.com",
        strategy: "email_code",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Enter the code you received")).toBeTruthy();
    });

    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText("verification-code"), {
      target: { value: "123456" },
    });
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    await waitFor(() => {
      expect(clerk_state.sign_in.attemptFirstFactor).toHaveBeenCalledWith({
        strategy: "email_code",
        code: "123456",
      });
    });

    await waitFor(() => {
      expect(clerk_state.set_active_sign_in).toHaveBeenCalledWith({
        session: "sess_sign_in",
      });
      expect(router_state.navigate).toHaveBeenCalledWith(
        "/settings?tab=billing",
        { replace: true },
      );
    });
  });

  it("INV-SES-002 preserves same-app redirects through sign-up fallback", async () => {
    router_state.redirect_to = "/projects";
    clerk_state.sign_in.create.mockRejectedValue({
      errors: [{ code: "form_identifier_not_found" }],
    });

    render(<SignInPage />);

    const email_input = screen.getByPlaceholderText(
      "Enter your email address...",
    );

    fireEvent.change(email_input, { target: { value: "new@example.com" } });
    fireEvent.submit(email_input.closest("form")!);

    await waitFor(() => {
      expect(clerk_state.sign_up.create).toHaveBeenCalledWith({
        emailAddress: "new@example.com",
      });
      expect(
        clerk_state.sign_up.prepareEmailAddressVerification,
      ).toHaveBeenCalledWith({
        strategy: "email_code",
      });
    });

    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText("verification-code"), {
      target: { value: "654321" },
    });
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    await waitFor(() => {
      expect(
        clerk_state.sign_up.attemptEmailAddressVerification,
      ).toHaveBeenCalledWith({
        code: "654321",
      });
    });

    await waitFor(() => {
      expect(clerk_state.set_active_sign_up).toHaveBeenCalledWith({
        session: "sess_sign_up",
      });
      expect(router_state.navigate).toHaveBeenCalledWith("/projects", {
        replace: true,
      });
    });
  });

  it("INV-SES-002 preserves same-app redirects through OAuth start", () => {
    router_state.redirect_to = "/inbox?filter=unread";

    render(<SignInPage />);

    fireEvent.click(screen.getByRole("button", { name: /google/i }));

    expect(clerk_state.sign_in.authenticateWithRedirect).toHaveBeenCalledWith({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/inbox?filter=unread",
    });
  });

  it.fails(
    "INV-SES-003 fails closed for off-app redirect targets",
    async () => {
      router_state.redirect_to = "https://evil.example/phish";

      render(<SignInPage />);

      fireEvent.click(screen.getByRole("button", { name: /google/i }));

      expect(
        clerk_state.sign_in.authenticateWithRedirect,
      ).toHaveBeenCalledWith({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    },
  );
});
