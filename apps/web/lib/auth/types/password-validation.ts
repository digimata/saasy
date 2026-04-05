// -------------------------------------
// projects/saasy/apps/web/lib/auth/types/password-validation.ts
//
// export type PasswordValidation    L10
// maxLength                         L14
// minLength                         L19
// regex                             L24
// -------------------------------------

export type PasswordValidation = {
  /**
   * Maximum password length
   */
  maxLength?: number;

  /**
   * Minimum password length
   */
  minLength?: number;

  /**
   * Password validation regex
   */
  regex?: RegExp;
};
