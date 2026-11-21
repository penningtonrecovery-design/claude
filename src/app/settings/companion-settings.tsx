"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { AvatarPortrait } from "@/components/avatar-portrait";
import { inputClass, Notice } from "@/components/auth-shell";
import {
  AVATARS,
  MAX_CAPTION_CHARS,
  MAX_UPLOAD_BYTES,
  type AvatarId,
  type CompanionMode,
} from "@/lib/companion/options";
import {
  removeKeepsake,
  setCompanionMode,
  updateKeepsakeCaption,
  uploadKeepsake,
  type CompanionState,
} from "./companion-actions";

const smallButton =
  "rounded-full bg-brass px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-brass-bright disabled:opacity-60";

const optionClass =
  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-line p-3 text-center transition hover:border-brass/60 has-[:checked]:border-brass has-[:checked]:bg-ink-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brass-bright";

export function CompanionSettings({
  mode,
  avatarId,
  photoUrl,
  caption,
}: {
  mode: CompanionMode;
  avatarId: AvatarId;
  photoUrl: string | null;
  caption: string | null;
}) {
  const [state, action, pending] = useActionState(setCompanionMode, undefined);
  const current = mode === "avatar" ? `avatar:${avatarId}` : mode;

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <fieldset className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <legend className="sr-only">How Fatherly Friend appears</legend>
          <label className={optionClass}>
            <input type="radio" name="choice" value="voice" defaultChecked={current === "voice"} className="sr-only" />
            <span aria-hidden className="h-20 w-20 rounded-full bg-[radial-gradient(circle_at_50%_40%,#ddb174_0%,#b5653b_45%,#3a2418_75%,transparent_76%)]" />
            <span className="text-sm text-cream">Voice only</span>
          </label>
          {AVATARS.map((a) => (
            <label key={a.id} className={optionClass} title={a.description}>
              <input type="radio" name="choice" value={`avatar:${a.id}`} defaultChecked={current === `avatar:${a.id}`} className="sr-only" />
              <AvatarPortrait id={a.id} className="h-20 w-20" title={`${a.name}, ${a.background}`} />
              <span className="text-sm text-cream">{a.name}</span>
              <span className="text-xs text-dust">{a.background}</span>
            </label>
          ))}
          <label className={`${optionClass} ${photoUrl ? "" : "cursor-not-allowed opacity-50"}`}>
            <input type="radio" name="choice" value="photo" defaultChecked={current === "photo"} disabled={!photoUrl} className="sr-only" />
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL; not worth the image optimizer
              <img src={photoUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
            ) : (
              <span aria-hidden className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-line text-2xl text-dust">+</span>
            )}
            <span className="text-sm text-cream">Your photo</span>
          </label>
        </fieldset>
        <p className="text-xs leading-relaxed text-dust">
          The grandfather portraits are AI-generated. None of them is a real person.
        </p>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={smallButton}>Save</button>
          {state?.ok && <span className="text-sm text-moss">{state.ok}</span>}
        </div>
        {state?.error && <Notice tone="error">{state.error}</Notice>}
      </form>

      <div className="border-t border-line/60 pt-6">
        <h3 className="font-serif text-xl text-cream">A photo of someone who mattered</h3>
        <p className="mt-2 text-sm leading-relaxed text-sand">
          A father figure, grandfather, coach or mentor. It sits beside Fatherly Friend as a still
          picture, like a photo on a mantel. He never speaks as them or pretends to be them, and the
          photo and caption are never sent to the AI. Only you can see it, and you can remove it any time.
        </p>
        <div className="mt-5">
          {photoUrl ? <KeepsakeManager photoUrl={photoUrl} caption={caption} /> : <KeepsakeUpload />}
        </div>
      </div>
    </div>
  );
}

function KeepsakeManager({ photoUrl, caption }: { photoUrl: string; caption: string | null }) {
  const [state, action, pending] = useActionState(updateKeepsakeCaption, undefined);
  const [removing, startRemoving] = useTransition();
  return (
    <div className="flex flex-col gap-5 sm:flex-row">
      {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
      <img src={photoUrl} alt="Your keepsake photo" className="h-40 w-40 rounded-xl border-4 border-[#5b4632] object-cover shadow-lg" />
      <div className="flex-1 space-y-3">
        <form action={action} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-sand">Caption (optional)</span>
            <input name="caption" defaultValue={caption ?? ""} maxLength={MAX_CAPTION_CHARS} className={inputClass} placeholder="e.g. Grandpa Joe" />
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className={smallButton}>Save caption</button>
            {state?.ok && <span className="text-sm text-moss">{state.ok}</span>}
          </div>
          {state?.error && <Notice tone="error">{state.error}</Notice>}
        </form>
        <button
          type="button"
          disabled={removing}
          onClick={() => {
            if (window.confirm("Remove this photo? It will be deleted.")) startRemoving(() => removeKeepsake());
          }}
          className="text-sm text-dust hover:text-alert"
        >
          {removing ? "Removing…" : "Remove photo"}
        </button>
      </div>
    </div>
  );
}

// Phone photos are often larger than we need. Shrink them in the browser so
// uploads stay quick and under the server's limit; the server re-encodes again.
async function shrinkForUpload(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob ? new File([blob], "keepsake.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // The server will explain if it can't use the file.
  }
}

function KeepsakeUpload() {
  const [state, setState] = useState<CompanionState>(undefined);
  const [pending, startUpload] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("photo");
    setState(undefined);
    startUpload(async () => {
      if (file instanceof File && file.size > 0) {
        const small = await shrinkForUpload(file);
        if (small.size > MAX_UPLOAD_BYTES) {
          setState({ error: "That photo is too large. Try one under 4 MB." });
          return;
        }
        form.set("photo", small);
      }
      setState(await uploadKeepsake(undefined, form));
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm text-sand">Photo (JPEG, PNG or WebP)</span>
        <input
          type="file"
          name="photo"
          required
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-sand file:mr-4 file:rounded-full file:border-0 file:bg-ink-3 file:px-4 file:py-2 file:text-cream hover:file:bg-line"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-sand">Caption (optional)</span>
        <input name="caption" maxLength={MAX_CAPTION_CHARS} className={inputClass} placeholder="e.g. Grandpa Joe" />
      </label>
      <label className="flex gap-3">
        <input type="checkbox" name="rights" required className="mt-1 h-4 w-4 accent-[#c99a5b]" />
        <span className="text-sm leading-relaxed text-sand">
          I have the right to use this photo, and I understand Fatherly Friend is an AI and won&apos;t
          speak as the person in it.
        </span>
      </label>
      <button type="submit" disabled={pending} className={smallButton}>
        {pending ? "Saving…" : "Add photo"}
      </button>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && <Notice tone="info">{state.ok}</Notice>}
    </form>
  );
}
