// Stand-in for `next/link` in the static build.
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useStaticRouter } from "../router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export default function Link({ href, onClick, children, ...rest }: Props) {
  const { navigate } = useStaticRouter();
  const top = href.split("#")[0].split("/")[1] ?? "";
  return (
    <a
      {...rest}
      href={top ? `#${top}` : "#"}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
