// -----------------------------
// projects/saasy/apps/web/lib/auth/types/invitation.ts
//
// export type Invitation    L15
// id                        L16
// organizationId            L17
// email                     L18
// role                      L19
// status                    L20
// inviterId                 L21
// expiresAt                 L22
// teamId                    L23
// -----------------------------

export type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: string;
  inviterId: string;
  expiresAt: Date;
  teamId?: string | undefined;
};
