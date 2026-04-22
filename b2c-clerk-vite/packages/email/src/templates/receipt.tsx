import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import type { EmailTemplate } from "../send";

export interface ReceiptEmailProps {
  firstName: string | null;
  amountFormatted: string;
  periodLabel?: string;
  hostedInvoiceUrl?: string;
  appName?: string;
}

export function ReceiptEmail({
  firstName,
  amountFormatted,
  periodLabel,
  hostedInvoiceUrl,
  appName = "Saasy",
}: ReceiptEmailProps) {
  const name = firstName ?? "there";
  return (
    <Html>
      <Head />
      <Preview>
        Your {appName} receipt — {amountFormatted}
      </Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb" }}>
        <Container style={{ maxWidth: 480, margin: "40px auto", padding: 24 }}>
          <Heading style={{ fontSize: 20, marginBottom: 16 }}>
            Payment received
          </Heading>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            Hi {name}, we've received your payment of{" "}
            <strong>{amountFormatted}</strong>
            {periodLabel ? ` for ${periodLabel}` : ""}.
          </Text>
          {hostedInvoiceUrl ? (
            <Section style={{ textAlign: "center" as const, marginTop: 24 }}>
              <Button
                href={hostedInvoiceUrl}
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
                View invoice
              </Button>
            </Section>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

export const ReceiptEmailTemplate: EmailTemplate<ReceiptEmailProps> = {
  Component: ReceiptEmail,
  subject: ({ appName = "Saasy" }) => `Your ${appName} receipt`,
};
