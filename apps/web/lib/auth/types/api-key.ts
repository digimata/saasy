// -------------------------
// projects/saasy/apps/web/lib/auth/types/api-key.ts
//
// export type ApiKey    L14
// id                    L15
// name                  L16
// start                 L17
// expiresAt             L18
// createdAt             L19
// updatedAt             L20
// metadata              L21
// -------------------------

export type ApiKey = {
  id: string;
  name?: string | null;
  start?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown> | null;
};
