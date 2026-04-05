import type { ReactNode } from "react";

// ----------------------------------------
// projects/saasy/apps/web/lib/auth/types/additional-fields.ts
//
// export type FieldType                L23
// export interface AdditionalField     L25
//   description                        L26
//   instructions                       L27
//   label                              L28
//   placeholder                        L29
//   required                           L30
//   type                               L31
//   multiline                          L35
//   validate                           L36
//   errorMessage                       L37
//   required                           L38
//   invalid                            L39
//   validate                           L40
// export interface AdditionalFields    L44
// ----------------------------------------

export type FieldType = "string" | "number" | "boolean" | "select";

export interface AdditionalField {
  description?: ReactNode;
  instructions?: ReactNode;
  label: ReactNode;
  placeholder?: string;
  required?: boolean;
  type: FieldType;
  /**
   * Render a multi-line textarea for string fields
   */
  multiline?: boolean;
  validate?: (value: string) => Promise<boolean>;
  errorMessage?: {
    required?: string;
    invalid?: string;
    validate?: string;
  };
}

export interface AdditionalFields {
  [key: string]: AdditionalField;
}
