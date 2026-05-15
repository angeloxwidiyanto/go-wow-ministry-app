"use client";

import { useState, useTransition } from "react";
import { inviteUserAction, deleteUserAction, updateUserRoleAction } from "./actions";

type AuthUser = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: { role?: string };
  invited_at?: string;
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Super Admin", color: "bg-purple-100 text-purple-700 border-purple-200" },
  admin:       { label: "Admin",       color: "bg-blue-50 text-blue-700 border-blue-100" },
};

function getRoleDisplay(user: AuthUser) {
  const r = user.user_metadata?.role ?? "admin";
  return ROLE_LABELS[r] ?? ROLE_LABELS.admin;
}

export default function ManageAccessClient({
  currentUserId,
  users,
}: {
  currentUserId: string;
  users: AuthUser[];
}) {
  const [isPending, startTransition] = useTransition();
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [localUsers, setLocalUsers] = useState<AuthUser[]>(users);

  function timeAgo(dateStr?: string) {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  function handleInvite(formData: FormData) {
    setInviteError("");
    setInviteSuccess("");
    startTransition(async () => {
      const result = await inviteUserAction(formData);
      if (result.error) {
        setInviteError(result.error);
      } else {
        setInviteSuccess(`Invite sent to ${formData.get("email")}`);
      }
    });
  }

  function handleDelete(userId: string, email?: string) {
    if (!confirm(`Remove access for ${email}? This cannot be undone.`)) return;
    setActionError("");
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (result.error) {
        setActionError(result.error);
      } else {
        setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    });
  }

  function handleRoleChange(userId: string, newRole: string) {
    setActionError("");
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, newRole);
      if (result.error) {
        setActionError(result.error);
      } else {
        setLocalUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, user_metadata: { ...u.user_metadata, role: newRole } }
              : u
          )
        );
      }
    });
  }

  return (
    <>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-4xl font-headline text-zinc-900">Manage Access</h1>
            <p className="text-zinc-500 font-body text-sm">
              Invite admins, adjust roles, and revoke access. Superadmin only.
            </p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-full">
          <span className="material-symbols-outlined text-primary text-[14px]">shield</span>
          <span className="text-xs font-semibold text-primary">You are logged in as Super Admin</span>
        </div>
      </header>

      {/* Invite New Admin */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">person_add</span>
          Invite New Admin
        </h2>

        <form action={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">mail</span>
            <input
              name="email"
              type="email"
              required
              placeholder="newadmin@wowministry.id"
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <select
            name="role"
            className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            Send Invite
          </button>
        </form>

        {inviteSuccess && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>
            <p className="text-xs text-emerald-700 font-medium">{inviteSuccess}</p>
          </div>
        )}
        {inviteError && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
            <p className="text-xs text-red-600 font-medium">{inviteError}</p>
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          An invitation email will be sent. They&apos;ll set their own password via the link.
        </p>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
          <p className="text-xs text-red-600 font-medium">{actionError}</p>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-zinc-400">group</span>
            Admin Users
          </h2>
          <span className="text-xs text-zinc-400">{localUsers.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Last Sign-in</th>
                <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {localUsers.map((u) => {
                const roleDisplay = getRoleDisplay(u);
                const isCurrentUser = u.id === currentUserId;
                const initials = (u.email ?? "?")[0].toUpperCase();

                return (
                  <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-purple-200 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                            {u.email}
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">You</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">{u.id.split("-")[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isCurrentUser ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleDisplay.color}`}>
                          {roleDisplay.label}
                        </span>
                      ) : (
                        <select
                          value={u.user_metadata?.role ?? "admin"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={isPending}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-zinc-500">{timeAgo(u.last_sign_in_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-zinc-500">{timeAgo(u.created_at)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isCurrentUser ? (
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          disabled={isPending}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Revoke access"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-300 px-2">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {localUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined text-3xl text-zinc-200 block mb-2">group</span>
                    <p className="text-sm text-zinc-400">No admin users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
