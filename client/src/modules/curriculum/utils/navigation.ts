import type { MouseEvent } from 'react';
import { shouldInterceptNavigation } from '../../../utils/navigation';
import type { Navigate, NavigationDestination } from '../types';

type NavigationClick = Pick<MouseEvent<HTMLAnchorElement>,
  'defaultPrevented' | 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'preventDefault'>;

export function navigateFromLink(event: NavigationClick, destination: NavigationDestination, navigate: Navigate) {
  if (!shouldInterceptNavigation(event)) return;
  event.preventDefault();
  navigate(destination);
}
