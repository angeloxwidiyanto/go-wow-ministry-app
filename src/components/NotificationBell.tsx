"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export type NotificationItem = {
  id: string;
  type: "proof_uploaded" | "new_order";
  title: string;
  subtitle: string;
  href: string;
  time: string;
};

export default function NotificationBell({
  items,
}: {
  items: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visible = items.filter((n) => !dismissed.has(n.id));
  const count = visible.length;

  function dismissOne(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  function dismissAll() {
    setDismissed(new Set(items.map((n) => n.id)));
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-zinc-500 hover:bg-purple-50 rounded-full transition-colors relative"
        aria-label="Notifications"
      >
        <span
          className={`material-symbols-outlined transition-transform duration-200 ${open ? "scale-110" : ""}`}
        >
          notifications
        </span>

        {/* Badge */}
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-[0px_20px_60px_-10px_rgba(0,0,0,0.15)] border border-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">notifications</span>
              <p className="text-sm font-semibold text-zinc-900">Notifications</p>
              {count > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                  {count} new
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={dismissAll}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Items */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-zinc-50">
            {visible.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-zinc-400">
                <span className="material-symbols-outlined text-3xl">notifications_off</span>
                <p className="text-xs font-medium">You&apos;re all caught up!</p>
              </div>
            ) : (
              visible.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50/80 transition-colors group"
                >
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === "proof_uploaded"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-purple-100 text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {item.type === "proof_uploaded" ? "receipt" : "how_to_reg"}
                    </span>
                  </div>

                  {/* Content */}
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs font-semibold text-zinc-800 leading-snug">{item.title}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{item.subtitle}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{item.time}</p>
                  </Link>

                  {/* Dismiss X */}
                  <button
                    onClick={() => dismissOne(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-zinc-300 hover:text-zinc-500 rounded shrink-0 mt-0.5"
                    aria-label="Dismiss"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {visible.length > 0 && (
            <div className="border-t border-zinc-100 px-4 py-2.5">
              <Link
                href="/admin/orders"
                onClick={() => setOpen(false)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all orders
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
