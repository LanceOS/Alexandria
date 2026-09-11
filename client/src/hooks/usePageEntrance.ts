import { useEffect, type RefObject } from 'react';
import { animate, stagger } from 'animejs';

export function usePageEntrance(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !containerRef.current) return;
    const targets = containerRef.current.querySelectorAll('[data-entrance]');
    if (!targets.length) return;
    const animation = animate(targets, {
      opacity: [0, 1], translateY: [10, 0], duration: 500, delay: stagger(70), ease: 'outQuad',
    });
    return () => { animation.revert(); };
  }, [containerRef]);
}
