import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : undefined;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand-strong px-12 py-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #7fd1c4 0, transparent 45%), radial-gradient(circle at 80% 75%, #2b8a7f 0, transparent 50%)",
          }}
        />
        <div className="relative">
          <p className="font-display text-2xl tracking-tight">CareBridge</p>
          <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/60">Care operations</p>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl leading-tight text-white">
            One workspace for the people coordinating care.
          </h1>
          <p className="mt-5 text-sm leading-6 text-white/70">
            Patient context, encounter notes, and a verifiable audit trail — built for teams that
            work under clinical and regulatory review.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 text-sm">
            <div>
              <dt className="text-white/50">Access model</dt>
              <dd className="mt-1 font-medium">Role-based, least privilege</dd>
            </div>
            <div>
              <dt className="text-white/50">Audit</dt>
              <dd className="mt-1 font-medium">Hash-chained events</dd>
            </div>
          </dl>
        </div>

        <p className="relative text-xs text-white/40">
          Authorized clinical personnel only. Activity may be monitored.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-2xl text-brand-strong">CareBridge</p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-muted">Care operations</p>
          </div>

          <h2 className="font-display text-3xl text-ink">Sign in</h2>
          <p className="mt-2 mb-8 text-sm text-muted">
            Use the account issued by your organization administrator.
          </p>

          <LoginForm nextPath={nextPath} />

          <p className="mt-10 text-[11px] uppercase tracking-[0.18em] text-muted/70">
            CareBridge Portal · Internal use only
          </p>
        </div>
      </section>
    </main>
  );
}
