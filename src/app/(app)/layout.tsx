import type { Role } from "@prisma/client";
import { requireSession } from "@/lib/auth/session";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();

  return (
    <div className="min-h-screen">
      <AppNav
        user={{
          name: user.name,
          email: user.email,
          role: user.role as Role,
        }}
      />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">{children}</main>
      <footer className="mx-auto w-full max-w-7xl px-5 pb-8 sm:px-8">
        <p className="border-t border-line pt-4 text-xs text-muted">
          CareBridge Portal · Session activity is recorded in the audit log.
        </p>
      </footer>
    </div>
  );
}
