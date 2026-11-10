// Stand-in for `next/navigation` in the static build.
import { useStaticRouter } from "../router";

export function usePathname(): string {
  return useStaticRouter().path;
}

export function useRouter() {
  const { navigate } = useStaticRouter();
  return { push: navigate, replace: navigate, back: () => history.back(), refresh: () => {}, prefetch: () => {} };
}
