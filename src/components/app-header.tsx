import Link from "next/link";
import { SiteHeader } from "@/components/site-chrome";

export function AppHeader({ current }: { current: "talk" | "plans" | "reflect" | "settings" }) {
  const link = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-sm ${active ? "text-cream" : "text-sand hover:text-cream"}`}
    >
      {label}
    </Link>
  );
  return (
    <SiteHeader compactBrand>
      {link("/talk", "Talk", current === "talk")}
      {link("/plans", "Plans", current === "plans")}
      {link("/reflect", "Reflect", current === "reflect")}
      {link("/settings", "Settings", current === "settings")}
    </SiteHeader>
  );
}

export function PageLoading({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-16 text-dust" role="status">
      {label}
    </div>
  );
}
