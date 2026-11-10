// Entry point for the self-contained static build (see scripts/build-static.mjs).
// Reuses the Next.js pages and components unchanged; only routing is swapped.
import { Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { StaticRouter, useStaticRouter } from "./router";
import { DemoProvider } from "@/lib/store";
import { AppShell, DemoBanner } from "@/components/AppShell";
import Home from "@/app/page";
import LoginPage from "@/app/login/page";
import CaregiverDashboard from "@/app/caregiver/page";
import ResidentsPage from "@/app/residents/page";
import ResidentProfile from "@/app/residents/[id]/page";
import SupervisorPage from "@/app/supervisor/page";
import AuditPage from "@/app/audit/page";
import ReportsPage from "@/app/reports/page";
import AssistantPage from "@/app/assistant/page";
import AdminPage from "@/app/admin/page";
import OnboardingPage from "@/app/onboarding/page";

const ROUTES: Record<string, () => ReactNode> = {
  "/": () => <Home />,
  "/login": () => <LoginPage />,
  "/caregiver": () => <CaregiverDashboard />,
  "/residents": () => <ResidentsPage />,
  "/supervisor": () => <SupervisorPage />,
  "/audit": () => <AuditPage />,
  "/reports": () => <ReportsPage />,
  "/assistant": () => <AssistantPage />,
  "/admin": () => <AdminPage />,
  "/onboarding": () => <OnboardingPage />,
};

// Pre-resolved params so React's `use()` returns synchronously.
type Settled<T> = Promise<T> & { status?: string; value?: T };
const paramCache = new Map<string, Settled<{ id: string }>>();
function paramsFor(id: string) {
  let p = paramCache.get(id);
  if (!p) {
    const value = { id };
    p = Promise.resolve(value) as Settled<{ id: string }>;
    p.status = "fulfilled";
    p.value = value;
    paramCache.set(id, p);
  }
  return p;
}

function Routes() {
  const { path } = useStaticRouter();
  const m = /^\/residents\/([^/]+)$/.exec(path);
  if (m) return <ResidentProfile key={m[1]} params={paramsFor(decodeURIComponent(m[1]))} />;
  return (ROUTES[path] ?? ROUTES["/"])();
}

createRoot(document.getElementById("root")!).render(
  <StaticRouter>
    <DemoBanner />
    <DemoProvider>
      <AppShell>
        <Suspense fallback={null}>
          <Routes />
        </Suspense>
      </AppShell>
    </DemoProvider>
  </StaticRouter>,
);
