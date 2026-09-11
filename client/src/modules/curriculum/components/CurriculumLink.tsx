import type { ReactNode } from 'react';
import { destinationHref } from '../../../utils/navigation';
import type { Navigate, NavigationDestination } from '../types';
import { navigateFromLink } from '../utils/navigation';

export function CurriculumLink({ destination, navigate, className, children, current }: {
  destination: NavigationDestination;
  navigate: Navigate;
  className?: string;
  children: ReactNode;
  current?: boolean;
}) {
  return <a className={className} href={destinationHref(destination)} aria-current={current ? 'page' : undefined}
    onClick={(event) => navigateFromLink(event, destination, navigate)}>{children}</a>;
}

