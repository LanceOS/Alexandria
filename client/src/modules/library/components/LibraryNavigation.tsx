import { Icon } from '../../../components/ui/index.js';
import type { LibraryNavigationProps } from '../types/index.js';
import { countCategoryTopics, selectedCategory } from '../utils/selectors.js';
import { subjectStyles } from '../utils/subjects.js';

export function LibraryNavigation({ data, category, isLibrary, onChooseSubject }: LibraryNavigationProps) {
  const categories = data?.categories ?? [];
  const selected = selectedCategory(data, category);
  return <div className="sidebar-content">
    <div className="nav-label">YOUR WORKSPACE</div>
    <button className="nav-item nav-primary" onClick={() => onChooseSubject('all')} aria-current={!selected && isLibrary ? 'page' : undefined}>
      <Icon name="grid" size={19} /><span>Library</span><Icon name="chevron-right" size={15} />
    </button>
    <div className="nav-label subjects-label">SUBJECTS</div>
    <nav aria-label="Subjects">
      <button className={`nav-item ${!selected ? 'is-current' : ''}`} aria-pressed={!selected} onClick={() => onChooseSubject('all')}>
        <span className="subject-dot dot-all" /><span>All subjects</span><span className="nav-count">{data?.topics.length ?? '–'}</span>
      </button>
      {categories.map((item) => <button key={item.id} className={`nav-item ${selected?.id === item.id ? 'is-current' : ''}`}
        aria-pressed={selected?.id === item.id} onClick={() => onChooseSubject(item.slug)}>
        <span className={`subject-dot dot-${subjectStyles[item.slug]?.className ?? 'all'}`} />
        <span>{item.slug === 'software' ? 'Software' : item.slug === 'artificial-intelligence' ? 'Artificial Intelligence' : item.name}</span>
        <span className="nav-count">{countCategoryTopics(data, item.id)}</span>
      </button>)}
    </nav>
  </div>;
}
