// ------------------------------------------
// projects/saasy/apps/web/app/(auth)/layout.tsx
//
// export default function AuthLayout()    L8
// children                                L8
// ------------------------------------------

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
