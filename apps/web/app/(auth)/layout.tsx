// ------------------------------------------
// projects/saasy/apps/web/app/(auth)/layout.tsx
//
// export default function AuthLayout()    L8
// children                                L8
// ------------------------------------------

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, oklch(0.18 0.003 286) 0%, oklch(0.08 0.002 286) 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {children}
    </div>
  );
}
