import { AcceptInvitationCard } from "@/components/auth/organization/accept-invitation-card";

// ---------------------------------------------------------------
// projects/saasy/apps/web/app/(auth)/accept-invitation/page.tsx
//
// export default function AcceptInvitationPage()    L9
// ---------------------------------------------------------------

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-4">
        <AcceptInvitationCard />
      </div>
    </div>
  );
}
