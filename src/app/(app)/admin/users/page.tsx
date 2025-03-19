import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { can } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { ROLE_LABELS, formatDate } from "@/lib/format";
import { listUsers } from "@/lib/services/users";
import { toggleUserAction, updateRoleAction } from "../actions";

export const metadata: Metadata = {
  title: "Users",
};

export default async function AdminUsersPage() {
  const { user } = await requireSession();

  if (!can(user.role, "user:manage")) {
    notFound();
  }

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Administration</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Users</h1>
          <p className="mt-1 text-sm text-muted">
            Manage roles and account status. Every change is recorded in the audit log.
          </p>
        </div>
        <p className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
          {users.filter((member) => member.isActive).length} active of {users.length}
        </p>
      </header>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="bg-canvas/60 text-[11px] uppercase tracking-[0.12em] text-muted">
                <th scope="col" className="px-5 py-3 font-medium">Member</th>
                <th scope="col" className="px-5 py-3 font-medium">Role</th>
                <th scope="col" className="px-5 py-3 font-medium">Caseload</th>
                <th scope="col" className="px-5 py-3 font-medium">Joined</th>
                <th scope="col" className="px-5 py-3 font-medium">Status</th>
                <th scope="col" className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => {
                const isSelf = member.id === user.id;

                return (
                  <tr key={member.id} className="table-row align-top">
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{member.name}</p>
                      <p className="text-xs text-muted">{member.email}</p>
                      {isSelf ? <p className="mt-1 text-[11px] text-brand">You</p> : null}
                    </td>
                    <td className="px-5 py-4">
                      <form action={updateRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={member.id} />
                        <select
                          name="role"
                          defaultValue={member.role}
                          disabled={isSelf}
                          className="rounded-md border border-line bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand disabled:opacity-60"
                        >
                          <option value="CLINICIAN">Clinician</option>
                          <option value="AUDITOR">Auditor</option>
                          <option value="ADMIN">Administrator</option>
                        </select>
                        {isSelf ? (
                          <span className="text-[11px] text-muted">{ROLE_LABELS[member.role]}</span>
                        ) : (
                          <button
                            type="submit"
                            className="rounded-md border border-line px-2 py-1.5 text-[11px] font-medium text-ink transition hover:bg-canvas"
                          >
                            Save
                          </button>
                        )}
                      </form>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {member._count.primaryPatients} patients
                      <br />
                      {member._count.encounters} encounters
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">{formatDate(member.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          member.isActive ? "bg-brand-soft text-brand-strong" : "bg-canvas text-muted"
                        }`}
                      >
                        {member.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {isSelf ? (
                        <span className="text-[11px] text-muted">—</span>
                      ) : (
                        <form action={toggleUserAction}>
                          <input type="hidden" name="userId" value={member.id} />
                          <input
                            type="hidden"
                            name="nextState"
                            value={member.isActive ? "inactive" : "active"}
                          />
                          <button
                            type="submit"
                            className={`rounded-md border px-2 py-1.5 text-[11px] font-medium transition ${
                              member.isActive
                                ? "border-danger/20 text-danger hover:bg-danger-soft"
                                : "border-brand/20 text-brand-strong hover:bg-brand-soft"
                            }`}
                          >
                            {member.isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
