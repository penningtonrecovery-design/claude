// Only allow post-sign-in redirects to paths on this site.
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/talk";
  }
  return next;
}
