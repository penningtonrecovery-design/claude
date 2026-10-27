"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MAX_PLAN_STEPS, MAX_STEP_CHARS } from "@/lib/growth/library";
import { createPlanSchema, type CreatePlanInput } from "@/lib/growth/schemas";
import { classifyMessage } from "@/lib/safety/classifier";
import { getCurrentUser } from "@/lib/supabase/server";

async function requireUser() {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) redirect("/login?next=/plans");
  return { supabase, user };
}

const id = z.uuid();

export async function createPlan(input: CreatePlanInput): Promise<{ error: string } | void> {
  const parsed = createPlanSchema.safeParse(input);
  if (!parsed.success) return { error: "Choose between 1 and 5 steps, each a sentence or two." };
  const { supabase } = await requireUser();

  const { data: plan, error } = await supabase
    .from("growth_plans")
    .insert({ topic: parsed.data.topic, focus: parsed.data.focus || null })
    .select("id")
    .single();
  if (error || !plan) return { error: "We couldn't save your plan. Please try again." };

  const { error: stepsError } = await supabase.from("plan_steps").insert(
    parsed.data.steps.map((s, i) => ({ plan_id: plan.id, content: s.content, source: s.source, position: i })),
  );
  if (stepsError) {
    await supabase.from("growth_plans").delete().eq("id", plan.id);
    return { error: "We couldn't save your plan. Please try again." };
  }

  revalidatePath("/plans");
  // If what he wrote suggests he's in crisis, show support alongside the plan.
  const crisis = classifyMessage(parsed.data.focus).level === "crisis";
  redirect(crisis ? "/plans?support=1" : "/plans");
}

export async function setStepDone(stepId: string, done: boolean): Promise<void> {
  if (!id.safeParse(stepId).success) return;
  const { supabase } = await requireUser();
  await supabase
    .from("plan_steps")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", stepId);
  revalidatePath("/plans");
}

export async function saveStepNote(stepId: string, note: string): Promise<{ error?: string }> {
  const parsed = z.string().trim().max(500).safeParse(note);
  if (!id.safeParse(stepId).success || !parsed.success) return { error: "Notes can be up to 500 characters." };
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("plan_steps")
    .update({ note: parsed.data || null })
    .eq("id", stepId);
  revalidatePath("/plans");
  return error ? { error: "Couldn't save the note." } : {};
}

export async function updateStepContent(stepId: string, content: string): Promise<{ error?: string }> {
  const parsed = z.string().trim().min(1).max(MAX_STEP_CHARS).safeParse(content);
  if (!id.safeParse(stepId).success || !parsed.success) return { error: "A step needs some words, up to 280 characters." };
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("plan_steps")
    .update({ content: parsed.data, source: "user" })
    .eq("id", stepId);
  revalidatePath("/plans");
  return error ? { error: "Couldn't save the step." } : {};
}

export async function addStep(planId: string, content: string): Promise<{ error?: string }> {
  const parsed = z.string().trim().min(1).max(MAX_STEP_CHARS).safeParse(content);
  if (!id.safeParse(planId).success || !parsed.success) return { error: "A step needs some words, up to 280 characters." };
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from("plan_steps")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId);
  if ((count ?? 0) >= MAX_PLAN_STEPS) return { error: `A plan holds up to ${MAX_PLAN_STEPS} steps. Keep it small.` };
  const { error } = await supabase
    .from("plan_steps")
    .insert({ plan_id: planId, content: parsed.data, source: "user", position: count ?? 0 });
  revalidatePath("/plans");
  return error ? { error: "Couldn't add the step." } : {};
}

export async function deleteStep(stepId: string): Promise<void> {
  if (!id.safeParse(stepId).success) return;
  const { supabase } = await requireUser();
  await supabase.from("plan_steps").delete().eq("id", stepId);
  revalidatePath("/plans");
}

export async function setPlanStatus(planId: string, status: "active" | "completed" | "archived"): Promise<void> {
  if (!id.safeParse(planId).success || !["active", "completed", "archived"].includes(status)) return;
  const { supabase } = await requireUser();
  await supabase
    .from("growth_plans")
    .update({ status, completed_at: status === "completed" ? new Date().toISOString() : null })
    .eq("id", planId);
  revalidatePath("/plans");
}

export async function deletePlan(planId: string): Promise<void> {
  if (!id.safeParse(planId).success) return;
  const { supabase } = await requireUser();
  await supabase.from("growth_plans").delete().eq("id", planId);
  revalidatePath("/plans");
}
