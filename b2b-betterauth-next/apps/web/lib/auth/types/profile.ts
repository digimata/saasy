// --------------------------
// projects/saasy/apps/web/lib/auth/types/profile.ts
//
// export type Profile    L20
// id                     L21
// email                  L22
// name                   L23
// displayUsername        L24
// username               L25
// displayName            L26
// firstName              L27
// fullName               L28
// isAnonymous            L29
// emailVerified          L30
// image                  L31
// avatar                 L32
// avatarUrl              L33
// --------------------------

export type Profile = {
  id?: string | number;
  email?: string | null;
  name?: string | null;
  displayUsername?: string | null;
  username?: string | null;
  displayName?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  isAnonymous?: boolean | null;
  emailVerified?: boolean | null;
  image?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
};
