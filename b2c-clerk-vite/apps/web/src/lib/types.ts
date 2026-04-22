export type User = {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeResponse = {
  user: User;
};

export type PlanId = "free" | "pro";

export type BillingStateResponse = {
  configured: boolean;
  checkoutPlans?: { pro: boolean };
  plan?: { id: PlanId; version: number };
  status?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  hasCustomer?: boolean;
};

export type Invoice = {
  id: string;
  date: number;
  description: string | null;
  status: string | null;
  amountDue: number;
  currency: string;
  hostedInvoiceUrl: string | null;
};

export type InvoicesResponse = {
  invoices: Invoice[];
  hasMore: boolean;
};
