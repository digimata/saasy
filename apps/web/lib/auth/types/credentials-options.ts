import type { PasswordValidation } from "./password-validation";

// -------------------------------------
// projects/saasy/apps/web/lib/auth/types/credentials-options.ts
//
// export type CredentialsOptions    L15
// confirmPassword                   L20
// forgotPassword                    L26
// passwordValidation                L31
// rememberMe                        L37
// username                          L43
// usernameRequired                  L49
// -------------------------------------

export type CredentialsOptions = {
  /**
   * Enable or disable the Confirm Password input
   * @default false
   */
  confirmPassword?: boolean;

  /**
   * Enable or disable Forgot Password flow
   * @default true
   */
  forgotPassword?: boolean;

  /**
   * Customize the password validation
   */
  passwordValidation?: PasswordValidation;

  /**
   * Enable or disable Remember Me checkbox
   * @default false
   */
  rememberMe?: boolean;

  /**
   * Enable or disable Username support
   * @default false
   */
  username?: boolean;

  /**
   * Make username required when username is enabled
   * @default true
   */
  usernameRequired?: boolean;
};
