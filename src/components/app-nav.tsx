"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { can, type Permission } from "@/lib/auth/rbac";
import { ROLE_LABELS } from "@/lib/format";
import { signOutAction } from "@/app/(app)/auth-actions";

const LINKS: Array<{ href: string; label: string; permission?: Permission }> = [
  { href: "/dashboard", label: "Overview" },
  { href: "/patients", label: "Patients" },
  { href: "/admin/users", label: "Users", permission: "user:manage" },
  { href: "/admin/audit", label: "Audit log", permission: "audit:read" },
];

export function AppNav({
  user,
}: {
  user: { name: string; email: string; role: Role };
}) {
  const pathname = usePathname();
  const visibleLinks = LINKS.filter((link) => !link.permission || can(user.role, link.permission));

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-6">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="font-display text-xl tracking-tight text-brand-strong">CareBridge</span>
            <span className="hidden text-[10px] uppercase tracking-[0.22em] text-muted sm:inline">
              Portal
            </span>
          </Link>

          <form action={signOutAction} className="lg:hidden">
            <button type="submit" className="text-xs font-medium text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </div>

        <nav aria-label="Primary" className="-mx-1 flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {visibleLinks.map((link) => {
            const active =
              pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-brand-soft font-medium text-brand-strong"
                    : "text-muted hover:bg-canvas hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight text-ink">{user.name}</p>
            <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
          </div>
          <form action={signOutAction} className="hidden lg:block">
            <button
              type="submit"
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-ink/30 hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
