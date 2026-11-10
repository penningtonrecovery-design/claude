"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/store";
import { homeFor } from "@/components/AppShell";

export default function Home() {
  const { user } = useDemo();
  const router = useRouter();
  useEffect(() => {
    router.replace(user ? homeFor(user.role) : "/login");
  }, [user, router]);
  return null;
}
