import { useEffect, useRef, useState } from 'react';
import { initialExpandedUnits, revealUnit, type LearningPathEntry } from '../utils/learningPath';

export function useLearningPath(entries: LearningPathEntry[], topicSlug: string) {
  const storageKey = `alexandria.learningPath.${encodeURIComponent(topicSlug)}`;
  const [expanded, setExpanded] = useState(() => {
    let saved = null;
    try { saved = window.sessionStorage.getItem(storageKey); } catch { /* Browsing works without storage. */ }
    return initialExpandedUnits(entries, saved);
  });
  const [jumpTarget, setJumpTarget] = useState<string | null>(null);
  const focusTargets = useRef(new Map<string, HTMLElement>());
  const collapsible = entries.filter((entry) => entry.depth > 0);
  const allExpanded = collapsible.every((entry) => expanded.has(entry.unit.id));

  useEffect(() => {
    try { window.sessionStorage.setItem(storageKey, JSON.stringify([...expanded])); } catch { /* View preferences are optional. */ }
  }, [expanded, storageKey]);

  useEffect(() => {
    if (!jumpTarget) return;
    const target = focusTargets.current.get(jumpTarget);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start', behavior: 'auto' });
    setJumpTarget(null);
  }, [jumpTarget, expanded]);

  function toggle(unitId: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  function toggleAll() {
    setExpanded(new Set(allExpanded ? [] : collapsible.map((entry) => entry.unit.id)));
  }

  function jumpToUnit(unitId: string) {
    setExpanded((previous) => revealUnit(entries, previous, unitId));
    setJumpTarget(unitId);
  }

  function registerHeading(unitId: string, element: HTMLElement | null) {
    if (element) focusTargets.current.set(unitId, element);
    else focusTargets.current.delete(unitId);
  }

  return { expanded, allExpanded, collapsibleCount: collapsible.length, toggle, toggleAll, jumpToUnit, registerHeading };
}
