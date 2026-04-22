import { createElement, type ComponentType } from "react";
import { Resend } from "resend";

import { EMAIL_FROM, RESEND_API_KEY } from "./env";

export interface EmailTemplate<P> {
  subject: (props: P) => string;
  Component: ComponentType<P>;
}

export interface SendResult {
  sent: boolean;
  id?: string;
}

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

/**
 * Send an email rendered from a React Email template.
 *
 * When `RESEND_API_KEY` is absent, the call is a no-op that logs the
 * template name, recipient, subject, and props to stdout. This keeps the
 * template runnable locally without a Resend account.
 */
export async function sendEmail<P extends object>(
  to: string,
  template: EmailTemplate<P>,
  props: P,
): Promise<SendResult> {
  const subject = template.subject(props);
  const resend = getClient();

  if (!resend) {
    const name = template.Component.displayName ?? template.Component.name;
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({ msg: "email.dry", template: name, to, subject, props }),
    );
    return { sent: false };
  }

  const element = createElement(template.Component, props);

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    react: element,
  });

  if (error) throw new Error(`resend.send failed: ${error.message}`);

  return { sent: true, id: data?.id };
}
