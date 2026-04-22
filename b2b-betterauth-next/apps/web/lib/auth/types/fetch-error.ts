// -----------------------------
// projects/saasy/apps/web/lib/auth/types/fetch-error.ts
//
// export type FetchError    L11
// code                      L12
// message                   L13
// status                    L14
// statusText                L15
// -----------------------------

export type FetchError = {
  code?: string | undefined;
  message?: string | undefined;
  status?: number;
  statusText?: string;
};
