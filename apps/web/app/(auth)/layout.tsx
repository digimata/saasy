// -------------------------------------------
// projects/saasy/apps/web/app/(auth)/layout.tsx
//
// export default function AuthLayout()     L8
// children                                L11
// -------------------------------------------

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
