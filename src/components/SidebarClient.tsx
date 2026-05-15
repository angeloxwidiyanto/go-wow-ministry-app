"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/login/actions";

export default function SidebarClient({
  isSuperAdmin,
  displayName,
  email,
}: {
  isSuperAdmin: boolean;
  displayName: string;
  email: string;
}) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path
      ? "flex items-center gap-4 px-4 py-3 rounded-lg bg-purple-50 text-purple-700 border-r-4 border-purple-600 transition-transform duration-300"
      : "flex items-center gap-4 px-4 py-3 rounded-lg text-zinc-600 transition-transform duration-300 hover:translate-x-1 hover:bg-purple-50/50";

  const isActivePrefix = (prefix: string) =>
    pathname.startsWith(prefix)
      ? "flex items-center gap-4 px-4 py-3 rounded-lg bg-purple-50 text-purple-700 border-r-4 border-purple-600 transition-transform duration-300"
      : "flex items-center gap-4 px-4 py-3 rounded-lg text-zinc-600 transition-transform duration-300 hover:translate-x-1 hover:bg-purple-50/50";

  return (
    <aside className="h-screen w-72 bg-white flex flex-col py-8 fixed left-0 top-0 z-50 border-r border-zinc-100 shadow-none overflow-y-auto">
      {/* Logo */}
      <div className="px-8 mb-8">
        <Image
          src="/logo.png"
          alt="Wonders of Worship"
          width={200}
          height={50}
          className="w-48 h-auto object-contain"
          priority
        />
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-4">
        <p className="px-4 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Main
        </p>
        <Link href="/admin" className={isActive("/admin")}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-body tracking-tight text-sm uppercase font-semibold">Overview</span>
        </Link>
        <Link href="/admin/members" className={isActivePrefix("/admin/members")}>
          <span className="material-symbols-outlined">group</span>
          <span className="font-body tracking-tight text-sm uppercase font-semibold">Members</span>
        </Link>
        <Link href="/admin/churches" className={isActivePrefix("/admin/churches")}>
          <span className="material-symbols-outlined">church</span>
          <span className="font-body tracking-tight text-sm uppercase font-semibold">Churches</span>
        </Link>
        <Link href="/admin/events" className={isActivePrefix("/admin/events")}>
          <span className="material-symbols-outlined">event</span>
          <span className="font-body tracking-tight text-sm uppercase font-semibold">Events</span>
        </Link>
        <Link href="/admin/orders" className={isActivePrefix("/admin/orders")}>
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-body tracking-tight text-sm uppercase font-semibold">Orders</span>
        </Link>
        <Link href="/admin/analytics" className={isActivePrefix("/admin/analytics")}>
          <span className="material-symbols-outlined">monitoring</span>
          <span className="font-body tracking-tight text-sm uppercase font-semibold">Analytics</span>
        </Link>
        <Link href="/admin/pending-contacts" className={isActivePrefix("/admin/pending-contacts")}>
          <span className="material-symbols-outlined">merge</span>
          <span className="font-body tracking-tight text-sm uppercase font-semibold">Pending Contacts</span>
        </Link>

        {/* Super Admin section */}
        {isSuperAdmin && (
          <>
            <div className="pt-4">
              <p className="px-4 py-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]">shield</span>
                Super Admin
              </p>
            </div>
            <Link
              href="/admin/manage-access"
              className={isActivePrefix("/admin/manage-access")}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span className="font-body tracking-tight text-sm uppercase font-semibold">Manage Access</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto px-4 space-y-0.5">
        {/* User info chip */}
        <div className="mx-4 mb-3 flex items-center gap-2.5 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-200 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {displayName[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900 truncate capitalize">{displayName}</p>
            <p className="text-[10px] text-zinc-400 truncate">{email}</p>
          </div>
          {isSuperAdmin && (
            <span className="shrink-0 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              SA
            </span>
          )}
        </div>

        <Link
          href="/admin/help"
          className="flex items-center gap-4 px-4 py-3 rounded-lg text-zinc-600 transition-transform duration-300 hover:translate-x-1 hover:bg-purple-50/50"
        >
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-body tracking-tight text-sm uppercase">Help Center</span>
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-zinc-600 transition-transform duration-300 hover:translate-x-1 hover:bg-red-50 hover:text-red-600"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-body tracking-tight text-sm uppercase">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
