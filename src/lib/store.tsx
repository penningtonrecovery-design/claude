"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createSeedState, STATE_VERSION } from "./seed";
import { login as loginAction, logout as logoutAction } from "./actions";
import { DemoRuleError, type DemoState, type Staff } from "./types";

const STORAGE_KEY = "caremar-demo-state";

export type ActionResult = { ok: true } | { ok: false; error: string };
type Transition = (state: DemoState, actor: Staff, now: number) => DemoState;

interface DemoContext {
  state: DemoState;
  now: number;
  user: Staff | null;
  /** Runs a pure state transition as the signed-in user, persisting the result. */
  run: (fn: Transition) => ActionResult;
  login: (staffId: string) => void;
  logout: () => void;
  reset: () => void;
}

const Ctx = createContext<DemoContext | null>(null);

function load(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed.version === STATE_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function save(s: DemoState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable (private mode, quota): the demo keeps working in memory.
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const ref = useRef<DemoState | null>(null);

  useEffect(() => {
    const initial = load() ?? createSeedState(Date.now());
    ref.current = initial;
    setState(initial);
    save(initial);
    const t = setInterval(() => setNow(Date.now()), 30_000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const s = load();
        if (s) {
          ref.current = s;
          setState(s);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const commit = useCallback((next: DemoState) => {
    ref.current = next;
    setState(next);
    save(next);
  }, []);

  const run = useCallback(
    (fn: Transition): ActionResult => {
      const current = ref.current;
      if (!current) return { ok: false, error: "Demo data is still loading." };
      const user = current.staff.find((s) => s.id === current.sessionStaffId);
      if (!user) return { ok: false, error: "Please sign in first." };
      const t = Date.now();
      try {
        commit(fn(current, user, t));
        setNow(t);
        return { ok: true };
      } catch (e) {
        if (e instanceof DemoRuleError) return { ok: false, error: e.message };
        console.error(e);
        return { ok: false, error: "Something went wrong in the demo." };
      }
    },
    [commit],
  );

  const login = useCallback((staffId: string) => {
    const current = ref.current;
    if (!current) return;
    let next = current.sessionStaffId ? logoutAction(current, Date.now()) : current;
    next = loginAction(next, staffId, Date.now());
    commit(next);
  }, [commit]);

  const logout = useCallback(() => {
    if (ref.current) commit(logoutAction(ref.current, Date.now()));
  }, [commit]);

  const reset = useCallback(() => {
    const t = Date.now();
    commit(createSeedState(t));
    setNow(t);
  }, [commit]);

  if (!state) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lg text-slate-600" role="status">
        Loading demo data…
      </div>
    );
  }

  const user = state.staff.find((s) => s.id === state.sessionStaffId && s.active) ?? null;
  return <Ctx.Provider value={{ state, now, user, run, login, logout, reset }}>{children}</Ctx.Provider>;
}

export function useDemo(): DemoContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo must be used inside DemoProvider");
  return c;
}
