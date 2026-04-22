import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

import type { EmailTemplate } from "../send";

export interface WelcomeEmailProps {
  firstName: string | null;
  appName?: string;
}

export function WelcomeEmail({ firstName, appName = "Saasy" }: WelcomeEmailProps) {
  const name = firstName ?? "there";
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <Container style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
          <Heading style={{ fontSize: 20, marginBottom: 16 }}>
            Welcome, {name}
          </Heading>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            Thanks for signing up for {appName}. We're glad to have you.
          </Text>
          <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}>
            If this wasn't you, please ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const WelcomeEmailTemplate: EmailTemplate<WelcomeEmailProps> = {
  Component: WelcomeEmail,
  subject: ({ appName = "Saasy" }) => `Welcome to ${appName}`,
};
