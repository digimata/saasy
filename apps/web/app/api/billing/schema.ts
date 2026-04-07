import { z } from "zod";

// ----------------------------------------------
// projects/saasy/apps/web/app/api/billing/schema.ts
//
// export const checkoutRequestSchema         L16
// export type CheckoutRequest                L20
// export const checkoutResponseSchema        L22
// export type CheckoutResponse               L26
// export const portalResponseSchema          L28
// export type PortalResponse                 L32
// export const billingStateResponseSchema    L34
// export type BillingStateResponse           L43
// ----------------------------------------------

export const checkoutRequestSchema = z.object({
  plan: z.enum(["pro", "ultra"]),
}).strict();

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

export const checkoutResponseSchema = z.object({
  url: z.string(),
});

export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;

export const portalResponseSchema = z.object({
  url: z.string(),
});

export type PortalResponse = z.infer<typeof portalResponseSchema>;

export const billingStateResponseSchema = z.object({
  configured: z.boolean(),
  checkoutPlans: z
    .object({
      pro: z.boolean(),
      ultra: z.boolean(),
    })
    .optional(),
  plan: z.object({
    id: z.enum(["hobby", "pro", "ultra"]),
    version: z.number(),
  }).optional(),
  status: z.string().nullable().optional(),
  currentPeriodEnd: z.string().nullable().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  hasCustomer: z.boolean().optional(),
});

export type BillingStateResponse = z.infer<typeof billingStateResponseSchema>;

export const invoiceSchema = z.object({
  id: z.string(),
  date: z.number(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  amountDue: z.number(),
  currency: z.string(),
  hostedInvoiceUrl: z.string().nullable(),
});

export const invoicesResponseSchema = z.object({
  invoices: z.array(invoiceSchema),
  hasMore: z.boolean(),
});
export type InvoicesResponse = z.infer<typeof invoicesResponseSchema>;
