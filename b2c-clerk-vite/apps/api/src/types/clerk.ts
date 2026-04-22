export type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

export type ClerkUserData = {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

export type ClerkDeletedData = {
  id: string;
  deleted?: boolean;
  object?: string;
};

export type ClerkEvent =
  | { type: "user.created"; data: ClerkUserData }
  | { type: "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: ClerkDeletedData }
  | { type: string; data: unknown };

export function primaryEmail(data: ClerkUserData): string | null {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id,
  );
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? null;
}
