"use client";
// Minimal in-memory router used only by the static single-page build.
// Top-level views are mirrored to a plain `#name` hash (the only form the host passes through).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const VIEWS = ["login", "caregiver", "residents", "supervisor", "audit", "reports", "assistant", "admin", "onboarding"];

type Nav = { path: string; navigate: (to: string) => void };
const RouterCtx = createContext<Nav>({ path: "/", navigate: () => {} });

function pathFromHash(): string {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
  return VIEWS.includes(h) ? `/${h}` : "/";
}

export function StaticRouter({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => pathFromHash());

  const navigate = useCallback((to: string) => {
    const clean = to.split("#")[0] || "/";
    setPath(clean);
    const top = clean.split("/")[1] ?? "";
    try {
      const next = VIEWS.includes(top) ? `#${top}` : "";
      if (window.location.hash !== next) history.replaceState(null, "", next || window.location.pathname + window.location.search);
    } catch {
      // history may be unavailable in some sandboxes; in-memory routing still works
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onHash = () => setPath(pathFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return <RouterCtx.Provider value={{ path, navigate }}>{children}</RouterCtx.Provider>;
}

export function useStaticRouter() {
  return useContext(RouterCtx);
}
