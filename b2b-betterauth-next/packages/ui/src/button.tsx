// ----------------------------
// projects/saasy/packages/ui/src/button.tsx
//
// interface ButtonProps    L15
//   children               L16
//   className              L17
//   appName                L18
// export const Button      L21
// ----------------------------

"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  return (
    <button className={className} onClick={() => alert(`Hello from your ${appName} app!`)}>
      {children}
    </button>
  );
};
