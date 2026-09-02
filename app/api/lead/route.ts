import { z } from "zod";
import { appendLead } from "@/lib/sheets";

export const runtime = "nodejs";

const RequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  business: z.string().trim().min(1, "Business name is required.").max(200),
  city: z.string().trim().max(200).default(""),
  auditedUrl: z.string().trim().max(2000).default(""),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    await appendLead(parsed.data);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Failed to store lead:", err);
    return Response.json(
      { error: "Couldn't save your request right now. Please try again in a moment." },
      { status: 500 },
    );
  }
}
