import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

interface InvitationEmailProps {
  organizationName: string;
  inviterName: string;
  role: string;
  acceptUrl: string;
}

export default function InvitationEmail({ organizationName, inviterName, role, acceptUrl }: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} invited you to {organizationName}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <Container style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
          <Heading style={{ fontSize: 20, marginBottom: 16 }}>You've been invited</Heading>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            {inviterName} invited you to join <strong>{organizationName}</strong> as {role === "admin" ? "an" : "a"} {role}.
          </Text>
          <Section style={{ textAlign: "center" as const, marginTop: 24 }}>
            <Button
              href={acceptUrl}
              style={{
                background: "#18181b",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Accept invitation
            </Button>
          </Section>
          <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 24 }}>
            If you weren't expecting this, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
