import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

interface OTPEmailProps {
  code: string;
}

export default function OTPEmail({ code }: OTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your verification code: {code}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <Container style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
          <Heading style={{ fontSize: 20, marginBottom: 16 }}>Verification code</Heading>
          <Section style={{ background: "#fff", borderRadius: 8, padding: 24, textAlign: "center" as const }}>
            <Text style={{ fontSize: 32, fontWeight: 700, letterSpacing: 6 }}>{code}</Text>
          </Section>
          <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 16 }}>
            This code expires in 10 minutes.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
