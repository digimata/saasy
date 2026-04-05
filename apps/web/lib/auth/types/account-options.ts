import type { AccountViewPaths } from "@/lib/auth/view-paths";

// ----------------------------------------
// projects/saasy/apps/web/lib/auth/types/account-options.ts
//
// export type AccountOptions           L16
// basePath                             L21
// fields                               L26
// viewPaths                            L30
// export type AccountOptionsContext    L33
// basePath                             L38
// fields                               L43
// viewPaths                            L47
// ----------------------------------------

export type AccountOptions = {
  /**
   * Base path for account-scoped views
   * @default "/account"
   */
  basePath?: string;
  /**
   * Array of fields to show in Account Settings
   * @default ["image", "name"]
   */
  fields: string[];
  /**
   * Customize account view paths
   */
  viewPaths?: Partial<AccountViewPaths>;
};

export type AccountOptionsContext = {
  /**
   * Base path for account-scoped views
   * @default "/account"
   */
  basePath: string;
  /**
   * Array of fields to show in Account Settings
   * @default ["image", "name"]
   */
  fields: string[];
  /**
   * Customize account view paths
   */
  viewPaths: AccountViewPaths;
};
