import type { ReactNode, SVGProps } from 'react';

const iconPaths = {
  book: <><path d="M12 6.2C8.9 4.3 5.4 4.2 2.5 5.1v14c2.9-.9 6.4-.8 9.5 1.1 3.1-1.9 6.6-2 9.5-1.1v-14c-2.9-.9-6.4-.8-9.5 1.1Z" /><path d="M12 6.2v14M6 8.8l2.5.5M6 12.3l2.5.5m7-3.5 2.5-.5m-2.5 4 2.5-.5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6" />,
  'arrow-left': <path d="M20 12H4m6-6-6 6 6 6" />,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  code: <><path d="m7 7-5 5 5 5m10-10 5 5-5 5m-4-14-2 18" /></>,
  sigma: <path d="M19 5V3H5l8 9-8 9h14v-2" />,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1 .8 2.2L22 5l-2.2.8L19 8l-.8-2.2L16 5l2.2-.8L19 2Z" /></>,
  bookmark: <path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4V4Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20.5 14.2A8.8 8.8 0 0 1 9.8 3.5a8.8 8.8 0 1 0 10.7 10.7Z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m4 12 5 5L20 6" />,
  circle: <circle cx="12" cy="12" r="8" />,
  sliders: <><path d="M4 7h8m4 0h4M4 17h3m4 0h9" /><circle cx="14" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  'arrow-up-right': <path d="M6 18 18 6M6 6h12v12" />,
  refresh: <><path d="M20 4v6h-6M4 20v-6h6" /><path d="M5.8 6.5A8 8 0 0 1 19 8l1 2M4 14l1 2a8 8 0 0 0 13.2 1.5" /></>,
  server: <><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01M7 17.5h.01M16 6.5h2M16 17.5h2" /></>,
  external: <><path d="M14 3h7v7m0-7L10 14" /><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof iconPaths;

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  const hasAccessibleName = Boolean(props['aria-label'] || props['aria-labelledby']);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={hasAccessibleName ? undefined : true}
      role={hasAccessibleName ? 'img' : undefined}
      focusable="false"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}
