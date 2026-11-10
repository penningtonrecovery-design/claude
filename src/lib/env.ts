/**
 * True in the self-contained hosted build (scripts/build-static.mjs), which runs
 * without a server and inside a sandbox that cannot print, download files or call APIs.
 */
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
