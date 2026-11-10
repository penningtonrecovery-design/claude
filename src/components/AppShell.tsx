"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpenCheck,
  Bot,
  ClipboardList,
  FileBarChart,
  LogOut,
  Pill,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useDemo } from "@/lib/store";
import { markNotificationsRead, notificationsFor } from "@/lib/actions";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { fmtDateTime } from "@/lib/time";
import { Avatar, Button, Dialog, cx } from "./ui";

export function DemoBanner() {
  return (
    <div role="note" className="no-print bg-red-700 px-3 py-1.5 text-center text-sm font-extrabold tracking-wide text-white sm:text-base">
      DEMO ONLY — NOT FOR CLINICAL USE · Fictional residents &amp; orders · Not HIPAA-compliant, not FDA-cleared, not validated
    </div>
  );
}

const NAV: { href: string; label: string; icon: typeof Pill; roles: Role[] }[] = [
  { href: "/caregiver", label: "Med pass", icon: Pill, roles: ["caregiver", "supervisor", "admin"] },
  { href: "/residents", label: "Residents", icon: Users, roles: ["caregiver", "supervisor", "admin"] },
  { href: "/supervisor", label: "Supervisor", icon: ShieldAlert, roles: ["supervisor", "admin"] },
  { href: "/audit", label: "Audit trail", icon: ShieldCheck, roles: ["supervisor", "admin"] },
  { href: "/reports", label: "Reports", icon: FileBarChart, roles: ["supervisor", "admin"] },
  { href: "/assistant", label: "AI assistant", icon: Bot, roles: ["supervisor", "admin"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin"] },
  { href: "/onboarding", label: "Onboarding", icon: BookOpenCheck, roles: ["admin"] },
];

export function homeFor(role: Role) {
  return role === "caregiver" ? "/caregiver" : role === "supervisor" ? "/supervisor" : "/admin";
}

function Notifications() {
  const { state, user, run } = useDemo();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const items = notificationsFor(state, user);
  const unread = items.filter((n) => !n.readBy.includes(user.id));
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-white hover:bg-white/15"
        aria-label={`Notifications, ${unread.length} unread`}
      >
        <Bell className="h-6 w-6" aria-hidden />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-amber-400 px-1 text-xs font-bold text-slate-950">{unread.length}</span>
        )}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Notifications (simulated)"
        footer={
          <Button
            variant="secondary"
            disabled={unread.length === 0}
            onClick={() => run((s, a) => markNotificationsRead(s, a.id, unread.map((n) => n.id)))}
          >
            Mark all read
          </Button>
        }
      >
        <p className="mb-3 text-sm text-slate-600">In-app only. No SMS, email or pager messages are sent in this demo.</p>
        {items.length === 0 ? (
          <p className="text-slate-600">No notifications.</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 40).map((n) => (
              <li key={n.id} className={cx("rounded-xl border p-3", n.readBy.includes(user.id) ? "border-slate-200 bg-white" : "border-brand-600 bg-brand-50")}>
                <div className="flex justify-between gap-2">
                  <span className="font-bold">{n.title}</span>
                  <span className="shrink-0 text-sm text-slate-500">{fmtDateTime(n.createdAt)}</span>
                </div>
                <p className="text-slate-700">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </>
  );
}

function UserSwitcher() {
  const { state, user, login, logout } = useDemo();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2">
      <Avatar name={user.name} id={user.id} size="sm" />
      <label className="sr-only" htmlFor="switch-user">
        Switch demo user
      </label>
      <select
        id="switch-user"
        value={user.id}
        onChange={(e) => {
          login(e.target.value);
          const s = state.staff.find((x) => x.id === e.target.value);
          if (s) router.push(homeFor(s.role));
        }}
        className="max-w-[11rem] rounded-lg border border-white/30 bg-brand-800 px-2 py-2 text-sm font-semibold text-white sm:max-w-none"
      >
        {state.staff
          .filter((s) => s.active)
          .map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {ROLE_LABEL[s.role]}
            </option>
          ))}
      </select>
      <button
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white hover:bg-white/15"
        aria-label="Sign out"
      >
        <LogOut className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, state } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!user && !isLogin) router.replace("/login");
  }, [user, isLogin, router]);

  if (isLogin) return <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>;
  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-[env(safe-area-inset-top,0px)] z-30 bg-brand-900 text-white shadow">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2">
          <Link href={homeFor(user.role)} className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-800">
              <ClipboardList aria-hidden className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-tight">MARcheck</span>
              <span className="block text-xs text-blue-100">{state.settings.facilityName}</span>
            </span>
          </Link>
          <span className="order-last w-full rounded-md bg-red-700 px-2 py-0.5 text-center text-xs font-extrabold tracking-wide sm:order-none sm:w-auto sm:text-sm">
            DEMO ONLY — NOT FOR CLINICAL USE
          </span>
          <div className="flex items-center gap-1">
            <Notifications />
            <UserSwitcher />
          </div>
        </div>
        <nav aria-label="Main" className="border-t border-white/10">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 py-1">
            {items.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              const Icon = n.icon;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-3 font-semibold",
                      active ? "bg-white text-brand-900" : "text-blue-50 hover:bg-white/15",
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-5">{children}</main>
      <footer className="no-print mx-auto max-w-7xl px-4 pb-8 text-center text-sm text-slate-500">
        MARcheck prototype for demonstration and market validation only. Do not use for real medication administration. All names and orders are fictional.
      </footer>
    </div>
  );
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useDemo();
  if (!user) return null;
  if (!roles.includes(user.role)) {
    return (
      <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6">
        <h1 className="text-xl font-bold">Not available for your role</h1>
        <p className="mt-1 text-slate-700">
          This page is for {roles.map((r) => ROLE_LABEL[r]).join(" / ")} accounts. You are signed in as {ROLE_LABEL[user.role]}. Use the switcher at the top to change demo user.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
