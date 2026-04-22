export { sendEmail, type EmailTemplate, type SendResult } from "./send";
export { EMAIL_FROM, RESEND_API_KEY, isEmailConfigured } from "./env";

export {
  WelcomeEmail,
  WelcomeEmailTemplate,
  type WelcomeEmailProps,
} from "./templates/welcome";

export {
  ReceiptEmail,
  ReceiptEmailTemplate,
  type ReceiptEmailProps,
} from "./templates/receipt";
