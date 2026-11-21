import { NextResponse, type NextRequest } from "next/server";
import { getVoiceConfig } from "@/lib/config";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  buildCreateWebCallBody,
  buildUpstreamHeaders,
  CREATE_WEB_CALL_PATH,
  PASSTHROUGH_RESPONSE_HEADERS,
  RETELL_API_BASE,
  SDK_VERSION_HEADER,
} from "@/lib/voice/retell";

// Starts a Retell web call for the signed-in user. Holds the Retell API key;
// the browser only ever receives the short-lived call credentials.
export async function POST(request: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!supabase || !user) {
    return NextResponse.json({ error_message: "Please sign in first." }, { status: 401 });
  }

  const voice = getVoiceConfig();
  if (!voice) {
    return NextResponse.json(
      { error_message: "Voice is not configured on this server yet." },
      { status: 503 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  let upstream: Response;
  try {
    upstream = await fetch(`${RETELL_API_BASE}${CREATE_WEB_CALL_PATH}`, {
      method: "POST",
      headers: buildUpstreamHeaders(voice.apiKey, request.headers.get(SDK_VERSION_HEADER)),
      body: JSON.stringify(
        buildCreateWebCallBody({ agentId: voice.agentId, displayName: profile?.display_name }),
      ),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error_message: "Couldn't reach the voice service. Please try again." },
      { status: 502 },
    );
  }

  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  for (const name of PASSTHROUGH_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  if (!upstream.ok) {
    console.warn(`[voice] Retell create-web-call failed with status ${upstream.status}`);
    return new NextResponse(
      JSON.stringify({ error_message: "The voice service declined to start a call." }),
      { status: 502, headers },
    );
  }

  return new NextResponse(await upstream.text(), { status: 200, headers });
}
